import os

from faker import Faker
from records import Database


PG_USER = os.getenv('PG_USER')
PG_PASS = os.getenv('PG_PASS')
DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASS}@localhost/"

db = Database(db_url=DATABASE_URL + 'postgres', isolation_level="AUTOCOMMIT")

db.query('DROP DATABASE IF EXISTS fakes;')
db.query('CREATE DATABASE fakes;')
db.close()

db = Database(db_url=DATABASE_URL + 'fakes')

Faker.seed(42)

fake = Faker()
users = []

for _ in range(1000):
    users.append(fake.simple_profile())

db.query("""
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    sex VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    mail VARCHAR NOT NULL,
    birthdate TIMESTAMP NOT NULL
);
""")

db.bulk_query("""
INSERT INTO "user" (
    username,
    name,
    sex,
    address,
    mail,
    birthdate
) VALUES (
    :username,
    :name,
    :sex,
    :address,
    :mail,
    :birthdate
);
""", users)

db.close()

print(f'fake users inserted')
