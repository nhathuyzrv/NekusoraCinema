from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.core.exceptions import ValidationError

from nekusoracinema.models import *


class ImageURLMixin:
    image_fields = ['image']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in getattr(self, 'image_fields', []):
            image_attr = getattr(instance, field, None)
            if image_attr and hasattr(image_attr, 'url'):
                try:
                    data[field] = image_attr.url
                except ValueError:
                    data[field] = None
        return data


class SimpleUserSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['avatar']

    class Meta:
        model = User
        fields = ['email', 'role', 'gender', 'loyalty_points', 'date_of_birth', 'phone_number', 'avatar', 'first_name', 'last_name']
        extra_kwargs = {
            'role': {
                'read_only': True,
            }
        }


class UserSerializer(SimpleUserSerializer):
    class Meta:
        model = SimpleUserSerializer.Meta.model
        fields = SimpleUserSerializer.Meta.fields + ['password']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def validate_password(self, value):
        try:
            validate_password(password=value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        user = User(**validated_data)
        user.username = user.email
        user.set_password(user.password)
        user.save()
        return user


class UserUpdateSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['avatar']

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'gender', 'date_of_birth', 'phone_number', 'avatar']


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name', 'slug']


class ActorSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['photo']

    class Meta:
        model = Actor
        fields = ['id', 'name', 'photo']


class SimpleMovieSerializer(ImageURLMixin, serializers.ModelSerializer):
    image_fields = ['poster']

    class Meta:
        model = Movie
        fields = ['id', 'title', 'age_rating' ,'poster', 'trailer_url', 'status', 'slug']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        avg_rating = getattr(instance, 'avg_rating')
        rating_count = getattr(instance, 'rating_count')

        data['avg_rating'] = round(avg_rating, 1) if avg_rating else None
        data['rating_count'] = rating_count if rating_count else None
        return data


class MovieDetailsSerializer(SimpleMovieSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    actors = ActorSerializer(many=True, read_only=True)
    class Meta:
        model = SimpleMovieSerializer.Meta.model
        fields = SimpleMovieSerializer.Meta.fields + ['duration', 'release_date', 'country', 'director', 'description', 'genres', 'actors', 'ratings']


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['id', 'user', 'movie', 'verified_booking', 'score', 'comment', 'created_at']



