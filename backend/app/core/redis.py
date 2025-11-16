from redis.asyncio import Redis
from fastapi import Depends

redis_client: Redis | None = None

async def init_redis():
    global redis_client
    redis_client = Redis(host='localhost', port=6379, db=0, decode_responses=True)

async def get_redis() -> Redis:
    if redis_client is None:
        raise RuntimeError("Redis client not initialized")
    return redis_client