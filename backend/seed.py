import os
import sys
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

import django

django.setup()

from apps.accounts.models import User
from apps.tables.models import DiningTable, TableSection
from apps.menu.models import Category, MenuItem

CATEGORY_ORDER = [
    'Rice',
    'Roti',
    'Nasta',
    'Snacks',
    'Soup',
    'Rice & Noodles',
    'Special Chaynij',
    'Chinese Starter',
    'Sweet Curry',
    'Punjabi Special Dish',
    'Maharashtrian Veg',
    'Special Handi',
    'Maharashtrian Tadka',
    'Special Paneer',
    'Punjabi Paneer',
    'Accompaniments',
]

MENU_ITEMS = [
    {'category': 'Rice', 'name': 'Jeera Rice', 'price': 130},
    {'category': 'Rice', 'name': 'Plain Rice', 'price': 120},
    {'category': 'Rice', 'name': 'Veg Pulav', 'price': 220},
    {'category': 'Rice', 'name': 'Paneer Pulao', 'price': 190},
    {'category': 'Rice', 'name': 'Kaju Paneer Pulao', 'price': 200},
    {'category': 'Rice', 'name': 'Veg Biryani', 'price': 210},
    {'category': 'Rice', 'name': 'Paneer Biryani', 'price': 200},
    {'category': 'Rice', 'name': 'Dal Khichdi', 'price': 170},
    {'category': 'Rice', 'name': 'Masala Rice', 'price': 160},
    {'category': 'Rice', 'name': 'Ghee Rice', 'price': 180},
    {'category': 'Rice', 'name': 'Veg Dum Biryani', 'price': 300},
    {'category': 'Rice', 'name': 'Curd Rice', 'price': 150},

    {'category': 'Roti', 'name': 'Tandoor Roti', 'price': 20},
    {'category': 'Roti', 'name': 'Butter Roti', 'price': 30},
    {'category': 'Roti', 'name': 'Plain Naan', 'price': 40},
    {'category': 'Roti', 'name': 'Butter Naan', 'price': 50},
    {'category': 'Roti', 'name': 'Vit Roti', 'price': 25},
    {'category': 'Roti', 'name': 'Vit Butter Roti', 'price': 35},
    {'category': 'Roti', 'name': 'Missi Roti', 'price': 40},
    {'category': 'Roti', 'name': 'Garlic Butter Naan', 'price': 60},
    {'category': 'Roti', 'name': 'Chij Garlic Butter Naan', 'price': 80},
    {'category': 'Roti', 'name': 'Butter Kulcha', 'price': 50},
    {'category': 'Roti', 'name': 'Lachha Paratha', 'price': 50},
    {'category': 'Roti', 'name': 'Aloo Paratha', 'price': 100},
    {'category': 'Roti', 'name': 'Paneer Paratha', 'price': 110},
    {'category': 'Roti', 'name': 'Fenugreek Paratha', 'price': 100},
    {'category': 'Roti', 'name': 'Stuffed Paratha', 'price': 100},
    {'category': 'Roti', 'name': 'Chapati', 'price': 20},
    {'category': 'Roti', 'name': 'Jowar Bhakri', 'price': 30},

    {'category': 'Nasta', 'name': 'Tea', 'price': 20},
    {'category': 'Nasta', 'name': 'Special Tea', 'price': 25},
    {'category': 'Nasta', 'name': 'Black Tea', 'price': 15},
    {'category': 'Nasta', 'name': 'Coffee', 'price': 25},
    {'category': 'Nasta', 'name': 'Milk', 'price': 30},
    {'category': 'Nasta', 'name': 'Buttermilk', 'price': 30},
    {'category': 'Nasta', 'name': 'Misal Pav', 'price': 100},
    {'category': 'Nasta', 'name': 'Misal Pav Special', 'price': 120},
    {'category': 'Nasta', 'name': 'Puri Bhaji', 'price': 80},
    {'category': 'Nasta', 'name': 'Pohe', 'price': 40},
    {'category': 'Nasta', 'name': 'Aloo Paratha', 'price': 100},
    {'category': 'Nasta', 'name': 'Dahi Dhapate', 'price': 120},
    {'category': 'Nasta', 'name': 'Shira', 'price': 50},
    {'category': 'Nasta', 'name': 'Upma', 'price': 70},
    {'category': 'Nasta', 'name': 'Pavbhaji', 'price': 100},
    {'category': 'Nasta', 'name': 'Sabudana Vada', 'price': 70},
    {'category': 'Nasta', 'name': 'Sabudana Khichdi', 'price': 70},
    {'category': 'Nasta', 'name': 'Finger Chips', 'price': 120},
    {'category': 'Nasta', 'name': 'Idli', 'price': 70},
    {'category': 'Nasta', 'name': 'Udid Vada', 'price': 80},
    {'category': 'Nasta', 'name': 'Idli Vada', 'price': 70},
    {'category': 'Nasta', 'name': 'Masala Dosa', 'price': 100},
    {'category': 'Nasta', 'name': 'Cut Dosa', 'price': 100},
    {'category': 'Nasta', 'name': 'Plain Dosa', 'price': 70},
    {'category': 'Nasta', 'name': 'Onion Uttapa', 'price': 80},
    {'category': 'Nasta', 'name': 'Tomato Omelette', 'price': 80},
    {'category': 'Nasta', 'name': 'Sukhi Bhel', 'price': 60},
    {'category': 'Nasta', 'name': 'Masala Papad', 'price': 40},
    {'category': 'Nasta', 'name': 'Fry Papad', 'price': 30},
    {'category': 'Nasta', 'name': 'Roasted Papad', 'price': 30},
    {'category': 'Nasta', 'name': 'Roasted Masala Papad', 'price': 40},
    {'category': 'Nasta', 'name': 'Papad Churi', 'price': 70},
    {'category': 'Nasta', 'name': 'Green Salad', 'price': 80},
    {'category': 'Nasta', 'name': 'Cucumber Salad', 'price': 70},
    {'category': 'Nasta', 'name': 'Carrot Salad', 'price': 70},

    {'category': 'Snacks', 'name': 'Peanuts Fry', 'price': 80},
    {'category': 'Snacks', 'name': 'Tawa Peanuts', 'price': 40},
    {'category': 'Snacks', 'name': 'Shwega Fry', 'price': 130},
    {'category': 'Snacks', 'name': 'Green Peas', 'price': 100},
    {'category': 'Snacks', 'name': 'Soybean Roast', 'price': 120},
    {'category': 'Snacks', 'name': 'Matki Fry', 'price': 120},
    {'category': 'Snacks', 'name': 'Kaju Fry', 'price': 180},
    {'category': 'Snacks', 'name': 'Onion Pakoda', 'price': 110},
    {'category': 'Snacks', 'name': 'Onion Bhaji', 'price': 100},
    {'category': 'Snacks', 'name': 'Chili Pakoda', 'price': 90},
    {'category': 'Snacks', 'name': 'Chilli Cut Pakoda', 'price': 100},
    {'category': 'Snacks', 'name': 'Paneer Pakoda', 'price': 150},
    {'category': 'Snacks', 'name': 'Mix Pakoda', 'price': 130},
    {'category': 'Snacks', 'name': 'Garlic Fry', 'price': 100},
    {'category': 'Snacks', 'name': 'Aloo Pakoda', 'price': 120},
    {'category': 'Snacks', 'name': 'Finger Chips', 'price': 120},
    {'category': 'Snacks', 'name': 'Masala Finger Chips', 'price': 130},
    {'category': 'Snacks', 'name': 'Okra Roast', 'price': 100},

    {'category': 'Special Chaynij', 'name': 'Veg Platter', 'price': 300},
    {'category': 'Special Chaynij', 'name': 'Paneer Platter', 'price': 400},
    {'category': 'Special Chaynij', 'name': 'Veg Spring Roll', 'price': 180},
    {'category': 'Special Chaynij', 'name': 'Veg Singai Roll', 'price': 190},

    {'category': 'Rice & Noodles', 'name': 'Veg Hakka Noodles', 'price': 170},
    {'category': 'Rice & Noodles', 'name': 'Veg Schezwan Noodles', 'price': 180},
    {'category': 'Rice & Noodles', 'name': 'Veg Triple Noodles', 'price': 210},
    {'category': 'Rice & Noodles', 'name': 'Veg Manchurian Noodles', 'price': 200},
    {'category': 'Rice & Noodles', 'name': 'Veg Singapuri Noodles', 'price': 190},
    {'category': 'Rice & Noodles', 'name': 'Veg Hong Kong Noodles', 'price': 190},
    {'category': 'Rice & Noodles', 'name': 'Fry Rice', 'price': 170},
    {'category': 'Rice & Noodles', 'name': 'Schezwan Rice', 'price': 180},
    {'category': 'Rice & Noodles', 'name': 'Triple Fried Rice', 'price': 210},
    {'category': 'Rice & Noodles', 'name': 'Singapuri Rice', 'price': 180},
    {'category': 'Rice & Noodles', 'name': 'Hong Kong Rice', 'price': 180},
    {'category': 'Rice & Noodles', 'name': 'Combination Rice', 'price': 200},
    {'category': 'Rice & Noodles', 'name': 'Lemon Rice', 'price': 180},
    {'category': 'Rice & Noodles', 'name': 'Manchurian Rice', 'price': 200},
    {'category': 'Rice & Noodles', 'name': 'Mushroom Fried Rice', 'price': 210},

    {'category': 'Soup', 'name': 'Veg Manchurian Soup', 'price': 100},
    {'category': 'Soup', 'name': 'Hot And Sour Soup', 'price': 110},
    {'category': 'Soup', 'name': 'Tomato Soup', 'price': 100},
    {'category': 'Soup', 'name': 'Veg Clear Soup', 'price': 100},
    {'category': 'Soup', 'name': 'Mushroom Soup', 'price': 110},
    {'category': 'Soup', 'name': 'Lemon Coriander Soup', 'price': 100},

    {'category': 'Chinese Starter', 'name': 'Veg Manchurian', 'price': 170},
    {'category': 'Chinese Starter', 'name': 'Veg Manchurian Gravy', 'price': 170},
    {'category': 'Chinese Starter', 'name': 'Cabbage Manchurian', 'price': 170},
    {'category': 'Chinese Starter', 'name': 'Cabbage 65', 'price': 170},
    {'category': 'Chinese Starter', 'name': 'Veg Crispy', 'price': 180},
    {'category': 'Chinese Starter', 'name': 'Veg Bullet', 'price': 190},
    {'category': 'Chinese Starter', 'name': 'Veg Crunchy', 'price': 200},
    {'category': 'Chinese Starter', 'name': 'Cabbage Kantaki', 'price': 170},
    {'category': 'Chinese Starter', 'name': 'Paneer Manchurian', 'price': 200},
    {'category': 'Chinese Starter', 'name': 'Paneer Chilli', 'price': 210},
    {'category': 'Chinese Starter', 'name': 'Paneer 65', 'price': 210},
    {'category': 'Chinese Starter', 'name': 'Paneer Shot', 'price': 220},
    {'category': 'Chinese Starter', 'name': 'Paneer Hong Kong', 'price': 210},
    {'category': 'Chinese Starter', 'name': 'Paneer Hot Pan', 'price': 220},
    {'category': 'Chinese Starter', 'name': 'Paneer Dragon', 'price': 210},
    {'category': 'Chinese Starter', 'name': 'Paneer Singapuri', 'price': 200},
    {'category': 'Chinese Starter', 'name': 'Paneer Crispy', 'price': 200},
    {'category': 'Chinese Starter', 'name': 'Paneer Butter Garlic', 'price': 210},
    {'category': 'Chinese Starter', 'name': 'Paneer Coriander', 'price': 200},

    {'category': 'Sweet Curry', 'name': 'Malai Kofta', 'price': 260},
    {'category': 'Sweet Curry', 'name': 'Paneer Pasanda', 'price': 280},
    {'category': 'Sweet Curry', 'name': 'Fenugreek Malai Matar', 'price': 250},
    {'category': 'Sweet Curry', 'name': 'Shahi Paneer', 'price': 260},
    {'category': 'Sweet Curry', 'name': 'Kaju Curry Sweet', 'price': 260},

    {'category': 'Punjabi Special Dish', 'name': 'Veg Kadai', 'price': 210},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Bhuna Masala', 'price': 210},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Chatpata', 'price': 220},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Patiala', 'price': 230},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Hyderabadi', 'price': 210},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Makhanwala', 'price': 230},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Jaipuri', 'price': 210},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Maharani', 'price': 220},
    {'category': 'Punjabi Special Dish', 'name': 'Khima Masala', 'price': 220},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Tiranga', 'price': 340},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Hara Bhara Masala', 'price': 230},
    {'category': 'Punjabi Special Dish', 'name': 'Veg Mastani', 'price': 230},

    {'category': 'Maharashtrian Veg', 'name': 'Veg Kolhapuri', 'price': 200},
    {'category': 'Maharashtrian Veg', 'name': 'Mix Veg', 'price': 200},
    {'category': 'Maharashtrian Veg', 'name': 'Kaju Masala', 'price': 230},
    {'category': 'Maharashtrian Veg', 'name': 'Kaju Curry', 'price': 230},
    {'category': 'Maharashtrian Veg', 'name': 'Fenugreek Fry', 'price': 150},
    {'category': 'Maharashtrian Veg', 'name': 'Fenugreek Masala', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Lasuni Methi', 'price': 170},
    {'category': 'Maharashtrian Veg', 'name': 'Eggplant Masala', 'price': 190},
    {'category': 'Maharashtrian Veg', 'name': 'Eggplant Bharta', 'price': 190},
    {'category': 'Maharashtrian Veg', 'name': 'Eggplant Curry', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Veg Maratha', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Ladyfinger Fry', 'price': 160},
    {'category': 'Maharashtrian Veg', 'name': 'Ladyfinger Masala', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Mushroom Masala', 'price': 200},
    {'category': 'Maharashtrian Veg', 'name': 'Mushroom Curry', 'price': 190},
    {'category': 'Maharashtrian Veg', 'name': 'Shevga Curry', 'price': 170},
    {'category': 'Maharashtrian Veg', 'name': 'Shevga Masala', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Soyabean Curry', 'price': 170},
    {'category': 'Maharashtrian Veg', 'name': 'Yesar Wadi', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Shev Bhaji', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Aalu Matar', 'price': 190},
    {'category': 'Maharashtrian Veg', 'name': 'Tawa Besan', 'price': 200},
    {'category': 'Maharashtrian Veg', 'name': 'Pitla', 'price': 190},
    {'category': 'Maharashtrian Veg', 'name': 'Fenugreek Besan Tawa', 'price': 210},
    {'category': 'Maharashtrian Veg', 'name': 'Tawa Besan Tadka', 'price': 210},
    {'category': 'Maharashtrian Veg', 'name': 'Umbar Curry', 'price': 190},
    {'category': 'Maharashtrian Veg', 'name': 'Akkha Masoor', 'price': 200},
    {'category': 'Maharashtrian Veg', 'name': 'Matki Masala', 'price': 180},
    {'category': 'Maharashtrian Veg', 'name': 'Matki Curry', 'price': 170},
    {'category': 'Maharashtrian Veg', 'name': 'Tomato Chutney', 'price': 160},
    {'category': 'Maharashtrian Veg', 'name': 'Green Peas Masala', 'price': 190},

    {'category': 'Special Handi', 'name': 'Veg Handi', 'price': 310},
    {'category': 'Special Handi', 'name': 'Veg Kolhapuri Handi', 'price': 310},
    {'category': 'Special Handi', 'name': 'Veg Diwani Handi', 'price': 320},
    {'category': 'Special Handi', 'name': 'Veg Bhuna Masala Handi', 'price': 320},
    {'category': 'Special Handi', 'name': 'Veg Hyderabadi Handi', 'price': 310},
    {'category': 'Special Handi', 'name': 'Paneer Masala Handi', 'price': 320},
    {'category': 'Special Handi', 'name': 'Paneer Butter Masala Handi', 'price': 330},
    {'category': 'Special Handi', 'name': 'Paneer Kolhapuri Handi', 'price': 340},
    {'category': 'Special Handi', 'name': 'Spinach Paneer Handi', 'price': 320},
    {'category': 'Special Handi', 'name': 'Paneer Matar Handi', 'price': 340},
    {'category': 'Special Handi', 'name': 'Paneer Tikka Handi', 'price': 350},
    {'category': 'Special Handi', 'name': 'Kaju Paneer Masala Handi', 'price': 380},
    {'category': 'Special Handi', 'name': 'Kaju Curry Handi', 'price': 360},
    {'category': 'Special Handi', 'name': 'Shev Bhaji Handi', 'price': 290},
    {'category': 'Special Handi', 'name': 'Shevga Masala Handi', 'price': 290},
    {'category': 'Special Handi', 'name': 'Baingan Masala Handi', 'price': 290},
    {'category': 'Special Handi', 'name': 'Fenugreek Masala Handi', 'price': 300},
    {'category': 'Special Handi', 'name': 'Veg Maratha Handi', 'price': 290},
    {'category': 'Special Handi', 'name': 'Kaju Masala Handi', 'price': 360},
    {'category': 'Special Handi', 'name': 'Mushroom Masala Handi', 'price': 350},
    {'category': 'Special Handi', 'name': 'Mushroom Curry Handi', 'price': 320},
    {'category': 'Special Handi', 'name': 'Soyabean Curry Handi', 'price': 290},
    {'category': 'Special Handi', 'name': 'Soyabean Masala Handi', 'price': 300},
    {'category': 'Special Handi', 'name': 'Yesarwadi Handi', 'price': 300},
    {'category': 'Special Handi', 'name': 'Dal Tadka Handi', 'price': 280},
    {'category': 'Special Handi', 'name': 'Dal Fry Handi', 'price': 280},
    {'category': 'Special Handi', 'name': 'Dal Fenugreek Handi', 'price': 310},
    {'category': 'Special Handi', 'name': 'Dal Kolhapuri Handi', 'price': 310},
    {'category': 'Special Handi', 'name': 'Umbar Handi', 'price': 300},

    {'category': 'Maharashtrian Tadka', 'name': 'Dal Fry', 'price': 160},
    {'category': 'Maharashtrian Tadka', 'name': 'Dal Tadka', 'price': 170},
    {'category': 'Maharashtrian Tadka', 'name': 'Dal Kolhapuri Tadka', 'price': 170},
    {'category': 'Maharashtrian Tadka', 'name': 'Dal Jeera', 'price': 140},
    {'category': 'Maharashtrian Tadka', 'name': 'Dal Fenugreek', 'price': 180},
    {'category': 'Maharashtrian Tadka', 'name': 'Dal Spinach', 'price': 180},
    {'category': 'Maharashtrian Tadka', 'name': 'Butter Dal Fry', 'price': 180},

    {'category': 'Special Paneer', 'name': 'Paneer Lababdar', 'price': 270},
    {'category': 'Special Paneer', 'name': 'Paneer Lijjat', 'price': 280},
    {'category': 'Special Paneer', 'name': 'Paneer Angara', 'price': 280},
    {'category': 'Special Paneer', 'name': 'Paneer Kofta', 'price': 240},
    {'category': 'Special Paneer', 'name': 'Paneer Patiya', 'price': 250},
    {'category': 'Special Paneer', 'name': 'Paneer Lahori', 'price': 260},
    {'category': 'Special Paneer', 'name': 'Paneer Fenugreek Masala', 'price': 250},
    {'category': 'Special Paneer', 'name': 'Paneer Lajawab', 'price': 290},
    {'category': 'Special Paneer', 'name': 'Paneer Takatak', 'price': 280},
    {'category': 'Special Paneer', 'name': 'Paneer Kolhapuri', 'price': 270},
    {'category': 'Special Paneer', 'name': 'Paneer Maharaja', 'price': 280},
    {'category': 'Special Paneer', 'name': 'Paneer Kasturi', 'price': 280},
    {'category': 'Special Paneer', 'name': 'Paneer Hyderabadi', 'price': 250},
    {'category': 'Special Paneer', 'name': 'Paneer Chatpata', 'price': 260},

    {'category': 'Punjabi Paneer', 'name': 'Chaturthi Special Paneer', 'price': 300},
    {'category': 'Punjabi Paneer', 'name': 'Paneer Masala', 'price': 210},
    {'category': 'Punjabi Paneer', 'name': 'Spinach Paneer', 'price': 210},
    {'category': 'Punjabi Paneer', 'name': 'Paneer Matar Masala', 'price': 220},
    {'category': 'Punjabi Paneer', 'name': 'Paneer Butter Masala', 'price': 220},
    {'category': 'Punjabi Paneer', 'name': 'Paneer Tikka Masala', 'price': 230},
    {'category': 'Punjabi Paneer', 'name': 'Kaju Paneer Masala', 'price': 250},
    {'category': 'Punjabi Paneer', 'name': 'Paneer Bhurji', 'price': 220},
    {'category': 'Punjabi Paneer', 'name': 'Paneer Kadai', 'price': 230},

    {'category': 'Accompaniments', 'name': 'Shengdana Chutney', 'price': 50},
    {'category': 'Accompaniments', 'name': 'Curd Bowl', 'price': 30},
    {'category': 'Accompaniments', 'name': 'Chilli Thesa Bowl', 'price': 50},
    {'category': 'Accompaniments', 'name': 'Boondi Raita', 'price': 100},
    {'category': 'Accompaniments', 'name': 'Veg Raita', 'price': 100},
    {'category': 'Accompaniments', 'name': 'Tadka Bowl', 'price': 30},
    {'category': 'Accompaniments', 'name': 'Buttermilk', 'price': 30},
]

USER_DATA = [
    ('owner1', 'owner123', User.Role.ADMIN, 'Hotel', 'Owner'),
    ('manager1', 'manager123', User.Role.MANAGER, 'John', 'Manager'),
    ('waiter1', 'waiter123', User.Role.WAITER, 'Sam', 'Waiter'),
    ('kitchen1', 'kitchen123', User.Role.KITCHEN, 'Chef', 'Ram'),
    ('cashier1', 'cashier123', User.Role.BILLER, 'Alice', 'Cashier'),
]

TABLE_SECTIONS = [
    ('Main Hall', 1),
    ('Garden', 2),
]

TABLES = [
    ('1', 4, 'Main Hall'),
    ('2', 4, 'Main Hall'),
    ('3', 4, 'Main Hall'),
    ('4', 4, 'Garden'),
    ('5', 4, 'Garden'),
]


def seed_users():
    for username, password, role, first, last in USER_DATA:
        if not User.objects.filter(username=username).exists():
            if role == User.Role.ADMIN:
                User.objects.create_superuser(
                    username=username,
                    password=password,
                    role=role,
                    first_name=first,
                    last_name=last,
                )
            else:
                User.objects.create_user(
                    username=username,
                    password=password,
                    role=role,
                    first_name=first,
                    last_name=last,
                )
            print(f'Created user: {username} ({role})')


def seed_tables():
    sections = {}
    for name, order in TABLE_SECTIONS:
        section, _ = TableSection.objects.get_or_create(
            name=name,
            defaults={'display_order': order},
        )
        sections[name] = section

    for number, capacity, section_name in TABLES:
        TableSection.objects.get_or_create(name=section_name)
        DiningTable.objects.get_or_create(
            number=number,
            defaults={
                'capacity': capacity,
                'section': sections[section_name],
            },
        )

    print('Created table sections and tables.')


def seed_categories():
    categories = {}
    for order, name in enumerate(CATEGORY_ORDER, start=1):
        category, _ = Category.objects.get_or_create(
            name=name,
            defaults={'display_order': order},
        )
        categories[name] = category
    print(f'Created {len(categories)} menu categories.')
    return categories


def seed_menu(categories):
    created = 0
    updated = 0

    for item in MENU_ITEMS:
        category = categories[item['category']]
        defaults = {
            'description': item.get('description', ''),
            'price': Decimal(item['price']),
            'is_veg': item.get('is_veg', True),
            'is_available': item.get('is_available', True),
            'inventory_deduction_quantity': Decimal(item.get('inventory_deduction_quantity', 1)),
        }
        menu_item, item_created = MenuItem.objects.get_or_create(
            name=item['name'],
            category=category,
            defaults={**defaults, 'category': category, 'name': item['name']},
        )

        if item_created:
            created += 1
            continue

        changed = False
        for field_name, value in defaults.items():
            if getattr(menu_item, field_name) != value:
                setattr(menu_item, field_name, value)
                changed = True

        if changed:
            menu_item.save()
            updated += 1

    print(f'Seeded menu items: {created} created, {updated} updated.')


def seed():
    print('Starting backend seed...')
    seed_users()
    seed_tables()
    categories = seed_categories()
    seed_menu(categories)
    print('Backend seed complete.')


if __name__ == '__main__':
    seed()
