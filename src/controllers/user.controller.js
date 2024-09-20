import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAcessAndRefreshTokens= async(userId)=>{
    try {
      const user=  await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token")
        
    }
}

const registerUser=asyncHandler( async(req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    const {fullName,email,username,password}=req.body
    console.log("email :",email);
    if (
        [fullName,email,username,password].some((fields)=>
        fields?.trim()=="")
    ) {
        throw new ApiError(400,"All fields are required")
    }
   const existedUser= await User.findOne({
        $or:[{username},{email}]
    })
    if (existedUser) {
        throw new ApiError(409,"user with email/username already existed")
    }
    console.log('req.files:', req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(avatarLocalPath)
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file is required")
    }
    
   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverImage= await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
    throw new ApiError(400,"avatar file is required")

   }
 const user= await User.create(
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
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registred sucessfully")
  )
    
})

const loginUser=asyncHandler(async (req,res)=>{

    const {email,username,password}=req.body
    if (!(username||email)) {
        throw new ApiError(400,"username or email is required")
        
    }
    const user= await User.findOne({
        $or:[{username},{email}]

    })
    if (!user) {
        throw new ApiError(404,"User doesnt exist")
        
    }
    const isPasswordValid=user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"Password is incorrect")

        
    }
   const {accessToken,refreshToken}= await generateAcessAndRefreshTokens(user._id)
   const loggedInUser=await User.findById(user._id).select("-password -refreshToken")


   const options={
    httpOnly :true,
    secure:true,
    //this allow the cookies to edit only on server side, not on front end side
   }

   return  res.
   status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(200,{
        user:loggedInUser,accessToken,refreshToken
    },
"User logged in sucessfully"
)
   )

})
const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user_id,
        {
            $set: {
                refreshToken: undefined // this removes the field from document
            }
            
        },
        {new:true}
    )

const options={
    httpOnly :true,
    secure:true,
    //this allow the cookies to edit only on server side, not on front end side
   }
   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(
    new ApiResponse(200,{},"User logged out")
   )
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    console.log(incomingRefreshToken);
    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }
   const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   const user=await User.findById(decodedToken?._id)
   console.log(user?.refreshToken);
   
   if (!user) {
    throw new ApiError(401,"invalid refresh token")
}

    if (incomingRefreshToken!==user?.refreshToken) {
        throw new ApiError(401,"refresh token is expired or used")

        
    }
    const options={
        httpOnly:true,
        secure:true
    }
    
    const {accessToken,newRefreshToken}=await generateAcessAndRefreshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,{
        accessToken,refreshToken:newRefreshToken
    },"access token refreshed"))

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=User.findById(req.user?._id)
const isPasswordCorrect=   await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400,"invalid Old password")
        }
        user.password=newPassword
        await user.save({validateBeforeSave:false})

        return res.status(200)
        .json(new ApiResponse(200,{},"password changed sucessfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{

    return res.status(200)
    .json(new ApiResponse(200,req.user,"current user fetched sucessfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body
    if (!(fullName|| email)) {
        throw new ApiError(400,"fullName and email are required")
        
    }

   const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            fullName,
            email
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json( new ApiResponse(200,user,"user account details updated sucessfully"))

})
const updateUserAvator=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if (!avatarLocalPath) {
        throw  new ApiError(400,"Avator is missing")
        
    }
const avatar=    uploadOnCloudinary(avatarLocalPath)
if (!avatar.url) {
    throw  new ApiError(400,"unable to upload avator")

    
    
}
          const user=   User.findByIdAndUpdate(req.user?._id,
                    {
                        $set:{
                            avatar:avatar.url
                        }
                    },
                        {new:true}
).select("-password")

return res.status(200)
.json(200,user,"avator uploaded sucessfully")


})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file.path
    if (!coverImageLocalPath) {
        throw new ApiError(400,"coverimage is missing")
}
const coverImage=uploadOnCloudinary(coverImageLocalPath)
if (!coverImage.url) {
    throw  new ApiError(400,"unable to upload coverImage")
    
}

const user=User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            coverImage:coverImage.url
        }
    },
    {new:true}
).select("-password")

return res.status(200)
.json( new ApiResponse(200,user,"CoverImage updated successfully"))
})
export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvator

}