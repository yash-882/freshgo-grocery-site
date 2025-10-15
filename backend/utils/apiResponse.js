// utilty for API 'OK' response

const sendApiResponse = (res, statusCode=200, {
    data = null,
    message = 'Request successful',
}) => {

    return res.status(statusCode).json({
        status: 'success', 
        message,
        dataLength: Array.isArray(data) ? data.length : undefined,
        data
    })
}

export default sendApiResponse;