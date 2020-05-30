import os
from dataclasses import dataclass

cpus = os.cpu_count()
pool_size = int(100 / cpus)


@dataclass
class User:
    id: int
    username: str
    name: str
    sex: str
    address: str
    mail: str
    birthdate: str


def caesarCipher(input: str) -> str:
    key = 14
    buf = bytearray(len(input))
    maxASCII = 127

    for i, char in enumerate(input):
        newCode = ord(char)

        if newCode >= 0 and newCode <= maxASCII:
            newCode += key

        if newCode > maxASCII:
            newCode -= 26
        elif newCode < 0:
            newCode += 26

        buf[i] = newCode

    return buf.decode('ascii')
