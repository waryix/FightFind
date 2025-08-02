import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchFilterProps {
  onSearch?: (filters: any) => void;
}

export function SearchFilter({ onSearch }: SearchFilterProps) {
  const [filters, setFilters] = useState({
    discipline: "",
    experienceLevel: "",
    location: "",
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    const searchFilters = {
      discipline: filters.discipline === "all" ? "" : filters.discipline,
      experienceLevel: filters.experienceLevel === "all" ? "" : filters.experienceLevel,
      location: filters.location,
    };
    onSearch?.(searchFilters);
  };

  const disciplines = [
    { value: "boxing", label: "Boxing" },
    { value: "mma", label: "MMA" },
    { value: "muay-thai", label: "Muay Thai" },
    { value: "bjj", label: "Brazilian Jiu-Jitsu" },
  ];

  const experienceLevels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "professional", label: "Professional" },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-fight-black mb-6">
          Find Sparring Partners Near You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="discipline" className="block text-sm font-medium text-gray-700 mb-2">
              Discipline
            </Label>
            <Select 
              value={filters.discipline} 
              onValueChange={(value) => handleFilterChange("discipline", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any discipline</SelectItem>
                {disciplines.map((discipline) => (
                  <SelectItem key={discipline.value} value={discipline.value}>
                    {discipline.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </Label>
            <Select 
              value={filters.experienceLevel} 
              onValueChange={(value) => handleFilterChange("experienceLevel", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any level</SelectItem>
                {experienceLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="City or ZIP code"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="focus:ring-2 focus:ring-fight-red focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <Button 
              className="w-full bg-fight-red hover:bg-fight-red-dark text-white"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Partners
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
