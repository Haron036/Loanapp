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
  const { login, register, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("mode") === "register" ? "register" : "login"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({}); // Stores specific field validation errors

  /* ================= STATE MANAGEMENT ================= */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

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

  /* ================= REDIRECT LOGIC ================= */
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  /* ================= LOGIN HANDLER ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success) setError(result.message || result.error || "Invalid credentials.");
    } catch (err) {
      setError("Connection refused. Is the backend running on port 8080?");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= REGISTER HANDLER ================= */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({}); // Clear previous field errors

    if (regData.password !== regData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const payload = {
      name: String(regData.name || "").trim(),
      email: String(regData.email || "").trim(),
      password: String(regData.password || ""),
      phone: String(regData.phone || "").trim(),
      address: String(regData.address || "").trim(),
      city: String(regData.city || "").trim(),
      state: String(regData.state || "").trim(),
      zipCode: String(regData.zipCode || "").trim(),
      dateOfBirth: regData.dateOfBirth, 
      annualIncome: parseFloat(regData.annualIncome) || 0.0,
      employmentType: String(regData.employmentType),
      monthlyDebt: parseFloat(regData.monthlyDebt) || 0.0,
    };

    try {
      const result = await register(payload);

      if (!result.success) {
        // Defensive check: only try to map details if it's a valid object
        if (result.details && typeof result.details === "object" && Object.keys(result.details).length > 0) {
          setFieldErrors(result.details);
          setError("Please correct the highlighted fields.");
        } else {
          setError(result.message || result.error || "Registration failed.");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError("A server error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render field errors
  const ErrorMsg = ({ field }) => fieldErrors[field] ? (
    <p className="text-[10px] text-destructive font-medium mt-1 animate-in fade-in slide-in-from-top-1">
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
                    <div className="col-span-2 space-y-1">
                      <Label className={fieldErrors.name ? "text-destructive" : ""}>Full Name</Label>
                      <Input
                        required
                        className={fieldErrors.name ? "border-destructive" : ""}
                        value={regData.name}
                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      />
                      <ErrorMsg field="name" />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className={fieldErrors.email ? "text-destructive" : ""}>Email</Label>
                      <Input
                        type="email"
                        required
                        className={fieldErrors.email ? "border-destructive" : ""}
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      />
                      <ErrorMsg field="email" />
                    </div>

                    <div className="space-y-1">
                      <Label className={fieldErrors.phone ? "text-destructive" : ""}>Phone</Label>
                      <Input
                        required
                        className={fieldErrors.phone ? "border-destructive" : ""}
                        value={regData.phone}
                        onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      />
                      <ErrorMsg field="phone" />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <Label className={fieldErrors.address ? "text-destructive" : ""}>Street Address</Label>
                      <Input
                        required
                        className={fieldErrors.address ? "border-destructive" : ""}
                        value={regData.address}
                        onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                      />
                      <ErrorMsg field="address" />
                    </div>

                    <div className="space-y-1">
                      <Label className={fieldErrors.city ? "text-destructive" : ""}>City</Label>
                      <Input
                        required
                        className={fieldErrors.city ? "border-destructive" : ""}
                        value={regData.city}
                        onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                      />
                      <ErrorMsg field="city" />
                    </div>

                    <div className="space-y-1">
                      <Label className={fieldErrors.state ? "text-destructive" : ""}>State</Label>
                      <Input
                        required
                        className={fieldErrors.state ? "border-destructive" : ""}
                        value={regData.state}
                        onChange={(e) => setRegData({ ...regData, state: e.target.value })}
                      />
                      <ErrorMsg field="state" />
                    </div>

                    <div className="space-y-1">
                      <Label className={fieldErrors.zipCode ? "text-destructive" : ""}>ZIP Code</Label>
                      <Input
                        required
                        className={fieldErrors.zipCode ? "border-destructive" : ""}
                        value={regData.zipCode}
                        onChange={(e) => setRegData({ ...regData, zipCode: e.target.value })}
                      />
                      <ErrorMsg field="zipCode" />
                    </div>

                    <div className="space-y-1">
                      <Label className={fieldErrors.dateOfBirth ? "text-destructive" : ""}>Date of Birth</Label>
                      <Input
                        type="date"
                        required
                        className={fieldErrors.dateOfBirth ? "border-destructive" : ""}
                        value={regData.dateOfBirth}
                        onChange={(e) => setRegData({ ...regData, dateOfBirth: e.target.value })}
                      />
                      <ErrorMsg field="dateOfBirth" />
                    </div>

                    <div className="space-y-1">
                      <Label className={fieldErrors.annualIncome ? "text-destructive" : ""}>Annual Income</Label>
                      <Input
                        type="number"
                        required
                        step="0.01"
                        className={fieldErrors.annualIncome ? "border-destructive" : ""}
                        value={regData.annualIncome}
                        onChange={(e) => setRegData({ ...regData, annualIncome: e.target.value })}
                      />
                      <ErrorMsg field="annualIncome" />
                    </div>

                    <div className="space-y-1">
                      <Label className={fieldErrors.password ? "text-destructive" : ""}>Password</Label>
                      <Input
                        type="password"
                        required
                        className={fieldErrors.password ? "border-destructive" : ""}
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      />
                      <ErrorMsg field="password" />
                    </div>

                    <div className="space-y-1">
                      <Label>Confirm</Label>
                      <Input
                        type="password"
                        required
                        value={regData.confirmPassword}
                        onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                      />
                    </div>
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