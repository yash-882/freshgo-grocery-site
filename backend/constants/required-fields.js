// fields required in specific routes of /auth
// each key represents an route handler that contains required field(s) as a value
export const authRequiredFields = {
    signUp: [
        // fields
        { field: 'email', label: 'Email' },
        { field: 'OTP', label: 'OTP' }
    ],

    validateForSignUp: [
        // fields
        { field: 'name', label: 'Name' },
        { field: 'password', label: 'Password' },
        { field: 'email', label: 'Email' },
        { field: 'confirmPassword', label: 'Password confirmation' },
    ],
    resetPassword: 
        // fields
        { field: 'email', label: 'Email' }
    ,
    login: [
        // fields
        { field: 'email', label: 'Email' },
        { field: 'password', label: 'Password' }
    ],
    changePassword: [
        // fields
        { field: 'currentPassword', label: 'Current password' },
        { field: 'newPassword', label: 'New password' },
        { field: 'confirmNewPassword', label: 'New password confirmation' },
    ],
    submitNewPassword: [
        // fields
        { field: 'email', label: 'Email' },
        { field: 'confirmNewPassword', label: 'New password confirmation' },
        { field: 'newPassword', label: 'New password' },
    ],
    requestEmailChange: [
        // fields
        { field: 'email', label: 'Email' },
        { field: 'confirmNewPassword', label: 'New password confirmation' },
        { field: 'newPassword', label: 'New password' },
    ],
    changeEmailWithOTP: 
        // fields
        { field: 'OTP', label: 'OTP' }
    ,
    verifyPasswordResetOTP: [
        // fields
        { field: 'email', label: 'Email' },
        { field: 'OTP', label: 'OTP' }
    ],
}