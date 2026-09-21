from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.routers import categories, products, users, reviews, cart, orders
from uuid import uuid4


app = FastAPI(version='0.1.0')

app.mount("/media", StaticFiles(directory="media"), name="media")

app.include_router(categories.router)
app.include_router(products.router)
app.include_router(users.router)
app.include_router(reviews.router)
app.include_router(cart.router)
app.include_router(orders.router)


@app.get('/')
async def get_page() -> dict:
    return {'detail': "Welcome to store forged with FastAPI"}
