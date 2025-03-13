/* Agar har route me try-catch likhna pade to bohot repetitive ho jata hai. 
 Isko avoid karne ke liye ek async wrapper function likhenge: */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler };

/*👆 Yeh function:
✔ Automatically async/await errors ko next() me pass karega.
✔ Har route me try-catch likhne ki zaroorat nahi hogi. */

//const asyncHanlder = (func) => {()=>{}}

// const asyncHanlder = (func) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({success: false, message: error.message})
//     }
// }