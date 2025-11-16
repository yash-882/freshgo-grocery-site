// set cookie
export const setCookie = (res, key, value, maxAge=15*60*1000) =>
    res.cookie(key, value, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge,
    })

// clear cookie
export const clearCookie = (res, key) =>
    res.clearCookie(key, {
        httpOnly: true,
        sameSite: 'strict'
})