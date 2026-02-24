import crypto from 'crypto';

const data = '{"sessionId":"testSession2222","merchantId":370550,"amount":1000,"currency":"PLN","crc":"534570a61575677f"}';

const sign = crypto
    .createHash('sha384')
    .update(data, 'utf8')
    .digest('hex');

console.log(sign);