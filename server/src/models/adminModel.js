import mongoose from "mongoose";

// struttura dei documenti nella collection "admin"
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, default: "", lowercase: true, trim: true },
  password: { type: String, required: true }, // hashata con bcryptjs
  role: { type: String, default: "admin" }
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema, "admin");

/*

"Admin" → nome del modello che userai nel codice per fare query 
(Admin.find(), Admin.create())

adminSchema → lo schema definito sopra

"admin" → nome della collection su MongoDB

*/
