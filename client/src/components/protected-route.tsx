import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
    const { user, isLoading } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (!isLoading && !user) {
            setLocation("/auth");
        }
    }, [user, isLoading, setLocation]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        // Return null or fragment while redirecting to avoid flash of content
        return null;
    }

    return <Component />;
}
