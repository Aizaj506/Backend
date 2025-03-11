import multer from "multer";

// Configure Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp") // File will be stored in temp folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage: storage })

export default upload;