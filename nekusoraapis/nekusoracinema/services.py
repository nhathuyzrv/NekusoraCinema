import redis

# SEAT HOLD
redis_client = redis.Redis(host='127.0.0.1', port=6379, db=1, decode_responses=True)
SEAT_HOLD_TTL = 420


def _seat_hold_key(showtime_id, seat_id):
    return f"seat_hold:{showtime_id}:{seat_id}"


def hold_seats(showtime_id, seat_ids, user_id, ttl=SEAT_HOLD_TTL):
    held_now = []
    conflict = []

    for seat_id in seat_ids:
        key = _seat_hold_key(showtime_id, seat_id)
        acquired = redis_client.set(key, str(user_id), nx=True, ex=ttl)
        if acquired:
            held_now.append(seat_id)
        elif redis_client.get(key) != str(user_id):
            conflict.append(seat_id)

    if conflict:
        release_seats(showtime_id, held_now, user_id)
        return False, conflict

    return True, held_now


def release_seats(showtime_id, seat_ids, user_id=None):
    for seat_id in seat_ids:
        key = _seat_hold_key(showtime_id, seat_id)
        if user_id is None or redis_client.get(key) == str(user_id):
            redis_client.delete(key)


def get_held_seat_ids(showtime_id):
    keys = redis_client.keys(_seat_hold_key(showtime_id, '*'))
    return [k.rsplit(':', 1)[-1] for k in keys]