import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavigationProps {
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Navigation({ user, onLogin, onLogout }: NavigationProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = user ? [
    { href: "/", label: "Home" },
    { href: "/partners", label: "Find Partners" },
    { href: "/gyms", label: "Gyms" },
  ] : [
    { href: "#features", label: "Features" },
    { href: "#safety", label: "Safety" },
    { href: "#pricing", label: "Pricing" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-fight-red cursor-pointer">
                FightFinder
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`px-3 py-2 font-medium ${
                      isActive(item.href)
                        ? "text-fight-red"
                        : "text-gray-700 hover:text-fight-red"
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/subscribe">
                    <Button 
                      variant="outline" 
                      className="text-fight-red border-fight-red hover:bg-fight-red hover:text-white"
                    >
                      Upgrade
                    </Button>
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={user.profileImageUrl} 
                            alt={`${user.firstName} ${user.lastName}`} 
                          />
                          <AvatarFallback>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onLogout}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button 
                  className="bg-fight-red text-white hover:bg-fight-red-dark"
                  onClick={onLogin}
                >
                  Sign Up
                </Button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigationItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start ${
                          isActive(item.href)
                            ? "text-fight-red"
                            : "text-gray-700 hover:text-fight-red"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  
                  {user ? (
                    <>
                      <Link href="/profile">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/subscribe">
                        <Button
                          variant="outline"
                          className="w-full text-fight-red border-fight-red hover:bg-fight-red hover:text-white"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Upgrade to Pro
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogout?.();
                        }}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="bg-fight-red text-white hover:bg-fight-red-dark"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogin?.();
                      }}
                    >
                      Sign Up
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
