from datetime import timedelta



def get_date_calc(date, day_count = 0):
    return date + timedelta(days=day_count)