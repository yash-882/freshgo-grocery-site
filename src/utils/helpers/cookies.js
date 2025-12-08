// set cookie
const setCookie = (res, key, value, maxAge=15*60*1000) =>
    res.cookie(key, value, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge,
    })

// clear cookie
const clearCookie = (res, key) =>
    res.clearCookie(key, {
        httpOnly: true,
        sameSite: 'strict'
    })

module.exports = { setCookie, clearCookie };