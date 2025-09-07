import client from '../configs/redis-client.js'

// Redis operations
class RedisService {
    constructor(uniqueID, purpose){
    //to set purpose and uniqueKey 
    // (a unique key is generated with the combination of 'purpose' and 'uniqueID' for Redis)
        this.purposes = {
            RESET_PASSWORD_OTP: 'reset-password',
            SIGN_UP_OTP: 'sign-up',
            EMAIL_CHANGE_OTP: 'change-email',
            RESET_PASSWORD_TOKEN: 'reset-password-token',
            DATA_CACHE: 'cached-data'
        }
        this.uniqueID = uniqueID;
        this.purpose = this.purposes[purpose] || purpose || 'unknown-purpose'
    }
    
// always prefix the Redis key with a unique action
// this helps Redis to differentiate OTP requests for the same uniqueID across routes (e.g., /sign-up, /change-password)
// example: /sign-up → sign-up:<uniqueID>, /change-password → change-password:<uniqueID>
    getKey(){

    return `${this.purpose}:${this.uniqueID}` 

    }

    // stores data with expiration time in Redis
    async setShortLivedData(data, ttl, isUpdate=false){
    const isObject = data !== null && typeof data === 'object' 

    if(isObject){
        data = JSON.stringify(data)
    }

    // XX (only set if already exists), NX (only set if doesn't exist)
    const condition = isUpdate ? 'XX' : 'NX'
    
    // temporarily (ttl example: 300 -> 5 minutes) store data in Redis
    await client.set(this.getKey(), data, {
        condition, 
        expiration:{ type: 'EX', value: ttl }
    })
}


    // store data in Redis
    async setData(data, isUpdate=false){
        const isObject = data !== null && typeof data === 'object'

    if(isObject){
        data = JSON.stringify(data)
    }

    // XX (only set if already exists), NX (only set if doesn't exist)
    const condition = isUpdate ? 'XX' : 'NX'

    //  store data in Redis
    await client.set(this.getKey(), data, {condition})
    }

    isJSON(data){
        try{
        const parsed = JSON.parse(data)

        // parsed can be null, boolean and number which JSON can parse withour any error
        // return true if parsed is an object
        return typeof parsed === 'object'
       
        } catch(err){
            // not a JSON data
            return false
        }
    } 
    

    // get data by key
    async getData(key = this.getKey()){
        const data = await client.get(key);

        if(this.isJSON(data)){
            return JSON.parse(data)
        }

        return data
    }

    // delete data by key
    async deleteData(key = this.getKey()){
        await client.del(key)
    }
}

export default RedisService