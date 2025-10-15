import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProgramCardProps {
  id: number;
  title: string;
  category: string;
  region: string;
  startDate: string;
  endDate: string;
  capacity: number;
  currentApplicants: number;
  imageUrl?: string;
  description: string;
  status: "모집중" | "마감" | "진행중" | "완료";
}

const ProgramCard = ({
  id,
  title,
  category,
  region,
  startDate,
  endDate,
  capacity,
  currentApplicants,
  imageUrl,
  description,
  status,
}: ProgramCardProps) => {
  const navigate = useNavigate();
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "모집중":
        return "default";
      case "마감":
        return "destructive";
      case "진행중":
        return "secondary";
      case "완료":
        return "outline";
      default:
        return "secondary";
    }
  };

  const isApplicationOpen = status === "모집중" && currentApplicants < capacity;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-card/50 flex flex-col h-full">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-accent to-primary/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium">{category}</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={getStatusVariant(status)} 
            className={`font-medium ${
              status === "완료" 
                ? "bg-gray-500 text-white border-gray-500" 
                : ""
            }`}
          >
            {status}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/90 text-foreground">
            {category}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <CardHeader className="pb-3 flex-shrink-0">
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mt-1 h-16 overflow-hidden">
            {description}
          </p>
        </CardHeader>

        <CardContent className="space-y-3 pb-4 flex-1">
          {/* Location */}
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{region}</span>
          </div>

          {/* Date */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{startDate} ~ {endDate}</span>
          </div>

          {/* Capacity */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{currentApplicants}/{capacity}명</span>
            <div className="ml-auto">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(currentApplicants / capacity) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-auto">
          <Button 
            className="w-full" 
            onClick={() => navigate(`/programs/${id}`)}
            variant="default"
          >
            자세히 보기
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default ProgramCard;