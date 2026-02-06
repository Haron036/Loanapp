import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isAuthenticated, user } = useAuth();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("mode") === "register" ? "register" : "login"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration state
  const [regData, setRegData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    dateOfBirth: "",
    annualIncome: "",
    employmentType: "Full-time",
    monthlyDebt: "0.0",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Use user.role (singular) as provided by AuthContext
      const role = user.role?.toLowerCase() || "user";
      if (role === "admin") navigate("/admin");
      else navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  /* ================= LOGIN HANDLER ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);

      if (!result.success) {
        setError(result.message || result.error || "Invalid credentials.");
      }
      // Navigation is handled in AuthContext login
    } catch (err) {
      setError("Server unreachable. Ensure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= REGISTER HANDLER ================= */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (regData.password !== regData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const payload = {
      name: regData.name.trim(),
      email: regData.email.trim(),
      password: regData.password,
      phone: regData.phone.trim(),
      address: regData.address.trim(),
      city: regData.city.trim(),
      state: regData.state.trim(),
      zipCode: regData.zipCode.trim(),
      dateOfBirth: regData.dateOfBirth,
      annualIncome: parseFloat(regData.annualIncome) || 0.0,
      employmentType: regData.employmentType,
      monthlyDebt: parseFloat(regData.monthlyDebt) || 0.0,
    };

    try {
      const result = await register(payload);

      if (!result.success) {
        if (result.details && typeof result.details === "object") {
          setFieldErrors(result.details);
          setError("Please correct the highlighted fields.");
        } else {
          setError(result.message || result.error || "Registration failed.");
        }
      }
      // Navigation handled in AuthContext login
    } catch (err) {
      setError("Server error. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Field-level error component
  const ErrorMsg = ({ field }) =>
    fieldErrors[field] ? (
      <p className="text-xs text-destructive font-medium mt-1 animate-in fade-in slide-in-from-top-1">
        {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <Card className="animate-scale-in shadow-2xl border-none">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg">
                <span className="text-secondary-foreground font-bold text-2xl">L</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">LoanPap Portal</CardTitle>
            <CardDescription>
              {activeTab === "login" ? "Secure Login" : "Join our lending platform"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* ================= LOGIN FORM ================= */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" variant="hero" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* ================= REGISTER FORM ================= */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Full Name", field: "name" },
                      { label: "Email", field: "email", type: "email" },
                      { label: "Phone", field: "phone" },
                      { label: "Street Address", field: "address", colSpan: 2 },
                      { label: "City", field: "city" },
                      { label: "State", field: "state" },
                      { label: "ZIP Code", field: "zipCode" },
                      { label: "Date of Birth", field: "dateOfBirth", type: "date" },
                      { label: "Annual Income", field: "annualIncome", type: "number" },
                      { label: "Password", field: "password", type: "password" },
                      { label: "Confirm", field: "confirmPassword", type: "password" },
                    ].map((input) => (
                      <div
                        key={input.field}
                        className={`space-y-1 ${input.colSpan === 2 ? "col-span-2" : ""}`}
                      >
                        <Label className={fieldErrors[input.field] ? "text-destructive" : ""}>
                          {input.label}
                        </Label>
                        <Input
                          required
                          type={input.type || "text"}
                          className={fieldErrors[input.field] ? "border-destructive" : ""}
                          value={regData[input.field]}
                          onChange={(e) =>
                            setRegData({ ...regData, [input.field]: e.target.value })
                          }
                        />
                        <ErrorMsg field={input.field} />
                      </div>
                    ))}
                  </div>

                  <Button type="submit" className="w-full mt-4" variant="hero" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}