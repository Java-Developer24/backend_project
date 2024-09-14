import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const registerUser=asyncHandler( async(req,res)=>{
    res.status(200).json({
        message:"ok"
    })

    const {fullName,email,username,password}=req.body
    console.log("email :",email);
    if (
        [fullName,email,username,password].some((fields)=>
        fields?.trim()=="")
    ) {
        throw new ApiError(400,"All fields are required")
    }
   const existedUser= User.findOne({
        $or:[{username},{email}]
    })
    if (existedUser) {
        throw new ApiError(409,"user with email/username already existed")
    }
    const avatarLocalPath=req.files?.avator[0]?.path
    const coverImageLocalPath=req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file is required")
    }
    
   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverImage= await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
    throw new ApiError(400,"avatar file is required")

   }
   User.create(
    {
        fullName,
        avatar:avatar.url,
        coverImage:coverImage.url||"",
        email,
        password,
        username:username.toLowerCase()
    }
   )

  const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
   )
   if (!createdUser) {
    throw new ApiError(500,"something went wrong while registering the user")
    
   }
  return 
    
})

export {registerUser}