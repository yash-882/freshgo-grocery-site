// fields required in specific routes of /auth
// each key represents a route handler that contains required field(s) as a value
export const authRequiredFields = {
    signUp: [
        'email', 
        'OTP'
    ],

    validateForSignUp: [
        'name', 
        'password', 
        'email', 
        'confirmPassword'
    ],

    resetPassword: ['email'],

    login: [
        'email', 
        'password'
    ],

    changePassword: [
        'currentPassword', 
        'newPassword', 
        'confirmNewPassword'
    ],

    submitNewPassword: [
        'email',
        'confirmNewPassword',
        'newPassword'
    ],

    requestEmailChange: [
        'email',
        'confirmNewPassword',
        'newPassword'
    ],

    changeEmailWithOTP: [
        'OTP'
    ],

    verifyPasswordResetOTP: [
        'email',
        'OTP'
    ],

    verifyPassword: [
        'password'
    ]
}