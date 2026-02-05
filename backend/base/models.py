from django.db import models
from django.contrib.auth.models import User



class Product(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    image = models.ImageField(null=True, blank=True)
    brand = models.CharField(max_length=200, null=True, blank=True)
    category = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    rating = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    numReviews = models.IntegerField(null=True, blank=True, default=0)
    price = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    countInStock = models.IntegerField(null=True, blank=True, default=0)
    createdAt = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True, editable=False)
    slug = models.SlugField(max_length=220, unique=True, null=True, blank=True)


    def __str__(self):
        return self.name


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True, default=0)
    comment = models.TextField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True, editable=False)
    
    # AI Sentiment Analysis fields
    sentiment = models.CharField(max_length=20, null=True, blank=True)  # positive, negative, neutral
    sentiment_score = models.FloatField(null=True, blank=True)  # -1 to 1

    def __str__(self):
        return str(self.rating)


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    paymentMethod = models.CharField(max_length=200, null=True, blank=True)
    taxPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    shippingPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    totalPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    isPaid = models.BooleanField(default=False)
    paidAt = models.DateTimeField(null=True, blank=True)
    isDelivered = models.BooleanField(default=False)
    deliveredAt = models.DateTimeField(null=True, blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return str(self.createdAt)


class OrderItem(models.Model):
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    qty = models.IntegerField(null=True, blank=True, default=0)
    price = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    image = models.CharField(max_length=200, null=True, blank=True)
    _id = models.AutoField(primary_key=True, editable=False)
    createdAt = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.name


class ShippingAddress(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, null=True, blank=True)
    address = models.CharField(max_length=200, null=True, blank=True)
    city = models.CharField(max_length=200, null=True, blank=True)
    postalCode = models.CharField(max_length=200, null=True, blank=True)
    country = models.CharField(max_length=200, null=True, blank=True)
    shippingPrice = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    _id = models.AutoField(primary_key=True, editable=False)

    def __str__(self):
        return self.address

class ProductEmbedding(models.Model):
    product = models.OneToOneField('Product', on_delete=models.CASCADE, related_name='embedding')
    vector = models.JSONField(default=list)  # list[float] - text embedding
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Embedding({self.product_id})"


class ProductImageEmbedding(models.Model):
    """Store image embeddings for visual search"""
    product = models.OneToOneField('Product', on_delete=models.CASCADE, related_name='image_embedding')
    vector = models.JSONField(default=list)  # list[float] - image embedding
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"ImageEmbedding({self.product_id})"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile_vec')
    vector = models.JSONField(default=list)  # list[float]
    updatedAt = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"UserProfile({self.user_id})"


class ProductEvent(models.Model):
    EVENT_CHOICES = (
        ('view', 'view'),
        ('add_to_cart', 'add_to_cart'),
        ('purchase', 'purchase'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    event_type = models.CharField(max_length=20, choices=EVENT_CHOICES)
    weight = models.FloatField(default=1.0)
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id}:{self.event_type}:{self.product_id}"


class Recommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    rec_type = models.CharField(max_length=32)
    score = models.FloatField(default=0.0)
    reason = models.CharField(max_length=255, blank=True, default='')
    createdAt = models.DateTimeField(auto_now_add=True)

    class Meta:
        # optional - but nice to avoid duplicate rows
        unique_together = ('user', 'product', 'rec_type')

    def __str__(self):
        return f"{self.user_id}:{self.rec_type}:{self.product_id}"
