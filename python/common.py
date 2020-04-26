import os
from dataclasses import dataclass

cpus = os.cpu_count()
pool_size = int(100 / cpus)


@dataclass
class User:
    username: str
    name: str
    sex: str
    address: str
    mail: str
    birthdate: str
