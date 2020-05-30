const os = require('os');

const cpus = os.cpus().length;
const poolSize = Math.floor(100 / cpus);

class User {
    constructor(obj) {
		this.id = obj.id;
        this.username = obj.username;
        this.name = obj.name;
        this.sex = obj.sex;
        this.address = obj.address;
        this.mail = obj.mail;
        this.birthdate = obj.birthdate.toISOString();
    }
}

/**
 * @param {string} str
 * @return {string}
 */
function caesarCipher(str) {
	const key = 14;
    const buf = Buffer.allocUnsafe(str.length);
    const maxASCII = 127;

	for (var i = 0; i < str.length; i ++) {
		let newCode = str.charCodeAt(i);

		if (newCode >= 0 && newCode <= maxASCII) {
			newCode += key;

			if (newCode > maxASCII) {
				newCode -= 26;
			} else if (newCode < 0) {
				newCode += 26;
			}
		}

		buf[i] = newCode;
	}

	return buf.toString('ascii');
}

exports.cpus = cpus;
exports.poolSize = poolSize;
exports.User = User;
exports.caesarCipher = caesarCipher;