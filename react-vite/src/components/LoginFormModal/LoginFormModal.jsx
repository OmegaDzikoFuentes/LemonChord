import { useState } from "react";
import { thunkLogin } from "../../redux/session";
import { useDispatch } from "react-redux";
import { useModal } from "../../context/Modal";
import "./LoginForm.css";

function LoginFormModal() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { closeModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Client-side validations
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      return setErrors(newErrors);
    }

    setErrors({});
    
    try {
      const serverResponse = await dispatch(thunkLogin({ email, password }));
      
      if (serverResponse) {
        setErrors(serverResponse);
      } else {
        closeModal();
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "Login failed. Please try again." });
    }
  };

  const isLoginDisabled = () => {
    return !email.trim() || !/\S+@\S+\.\S+/.test(email) || !password.trim();
  };

  return (
    <div className="cassette-modal">
      <h1>Log In</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {errors.email && <p className="error">{errors.email}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {errors.password && <p className="error">{errors.password}</p>}
        {errors.general && <p className="error">{errors.general}</p>}
        <button 
          type="submit" 
          disabled={isLoginDisabled()}
          className={isLoginDisabled() ? "disabled" : ""}
        >
          Log In
        </button>
      </form>
    </div>
  );
}

export default LoginFormModal;