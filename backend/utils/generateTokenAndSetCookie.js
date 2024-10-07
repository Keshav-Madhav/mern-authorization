import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (res, id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  })

  res.cookie("tokenJWT", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
  })

  return token;
}