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
    monthlyDebt: 0.0,
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

    if (regData.password !== regData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    // Exact payload matching AuthDTO.RegisterRequest
    const payload = {
      name: regData.name,
      email: regData.email,
      password: regData.password,
      phone: regData.phone,
      address: regData.address,
      city: regData.city,
      state: regData.state,
      zipCode: regData.zipCode,
      dateOfBirth: regData.dateOfBirth,
      annualIncome: parseFloat(regData.annualIncome) || 0,
      employmentType: regData.employmentType,
      monthlyDebt: regData.monthlyDebt || 0.0,
    };

    console.group("🚀 Registration Payload");
    console.log(payload);
    console.groupEnd();

    try {
      const result = await register(payload);

      if (!result.success) {
        if (result.details && typeof result.details === "object") {
          const firstError = Object.entries(result.details)[0];
          setError(`${firstError[0]}: ${firstError[1]}`);
        } else {
          setError(result.message || result.error || "Registration failed.");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const serverError = err.response?.data?.message || err.message;
      setError(`Server Error: ${serverError}`);
      console.error("Backend Trace:", err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

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
                      <Label>Full Name</Label>
                      <Input
                        required
                        value={regData.name}
                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        required
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input
                        required
                        value={regData.phone}
                        onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Street Address</Label>
                      <Input
                        required
                        value={regData.address}
                        onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>City</Label>
                      <Input
                        required
                        value={regData.city}
                        onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>State</Label>
                      <Input
                        required
                        value={regData.state}
                        onChange={(e) => setRegData({ ...regData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>ZIP Code</Label>
                      <Input
                        required
                        value={regData.zipCode}
                        onChange={(e) => setRegData({ ...regData, zipCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        required
                        value={regData.dateOfBirth}
                        onChange={(e) => setRegData({ ...regData, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Annual Income</Label>
                      <Input
                        type="number"
                        required
                        value={regData.annualIncome}
                        onChange={(e) => setRegData({ ...regData, annualIncome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        required
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Confirm Password</Label>
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
