from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import categories, products, users, reviews, cart, orders


app = FastAPI(version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory="media"), name="media")

api_router = APIRouter(prefix="/api")
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(users.router)
api_router.include_router(reviews.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)

app.include_router(api_router)

@app.get('/')
async def get_page() -> dict:
    return {'detail': "Welcome to store forged with FastAPI"}
