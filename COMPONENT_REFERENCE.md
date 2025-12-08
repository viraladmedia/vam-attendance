# Component Reference Guide

## Overview
This guide provides quick references for all available components in the VAM Attendance application.

---

## Layout Components

### Header
**Location**: `components/layout/Header.tsx`

**Purpose**: Sticky navigation bar for public pages

**Usage**:
```tsx
import { Header } from "@/components/layout/Header";

export default function Page() {
  return <Header />;
}
```

**Features**:
- Responsive navigation
- Mobile hamburger menu
- Active page highlighting
- Quick action buttons

---

### Footer
**Location**: `components/layout/Footer.tsx`

**Purpose**: Footer with links and company information

**Usage**:
```tsx
import { Footer } from "@/components/layout/Footer";

export default function Page() {
  return <Footer />;
}
```

**Features**:
- Multi-column layout
- Social media links
- Copyright information
- Link sections (Product, Company, Legal)

---

## Dashboard Components

### TopBar
**Location**: `components/dashboard/TopBar.tsx`

**Purpose**: Dashboard header with title and profile menu

**Usage**:
```tsx
import { TopBar } from "@/components/dashboard/TopBar";

export default function Page() {
  return (
    <TopBar 
      title="Page Title" 
      subtitle="Page Subtitle"
      showAccountInTitle={true}
      showAccountIdInSubtitle={true}
    />
  );
}
```

**Props**:
- `title?: string` - Main title
- `subtitle?: string` - Subtitle/section
- `showAccountInTitle?: boolean` - Show account in title
- `showAccountIdInSubtitle?: boolean` - Show account ID in subtitle

---

### Sidebar
**Location**: `components/dashboard/Sidebar.tsx`

**Purpose**: Navigation sidebar for dashboard

**Features**:
- Collapsible navigation
- Active page highlighting
- Icon display
- Submenu support
- Persistent state in localStorage

---

### AccountContext
**Location**: `components/dashboard/AccountContext.tsx`

**Purpose**: Global account/organization context

**Usage**:
```tsx
import { useAccount } from "@/components/dashboard/AccountContext";

export default function Component() {
  const { accountId, accountLabel, setAccount } = useAccount();
  
  return <div>{accountLabel}</div>;
}
```

**Provides**:
- `accountId: string` - Current account ID
- `accountLabel: string` - Account display name
- `setAccount(id, label)` - Update account

---

## UI Components

### Card
**Location**: `components/ui/card.tsx`

**Purpose**: Container component for content sections

**Usage**:
```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

---

### Button
**Location**: `components/ui/button.tsx`

**Purpose**: Clickable button component

**Usage**:
```tsx
import { Button } from "@/components/ui/button";

<Button>Click Me</Button>
<Button variant="outline">Outline</Button>
<Button disabled>Disabled</Button>
```

**Variants**:
- `default` - Primary button
- `outline` - Bordered button
- `ghost` - Transparent button
- `destructive` - Danger button

---

### Input
**Location**: `components/ui/input.tsx`

**Purpose**: Text input field

**Usage**:
```tsx
import { Input } from "@/components/ui/input";

<Input 
  type="email"
  placeholder="Enter email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

### Select
**Location**: `components/ui/select.tsx`

**Purpose**: Dropdown selection

**Usage**:
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Checkbox
**Location**: `components/ui/checkbox.tsx`

**Purpose**: Checkbox input

**Usage**:
```tsx
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox 
  checked={checked}
  onCheckedChange={setChecked}
/>
```

---

### Badge
**Location**: `components/ui/badge.tsx`

**Purpose**: Small labeled element

**Usage**:
```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Label</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="secondary">Secondary</Badge>
```

---

### Avatar
**Location**: `components/ui/avatar.tsx`

**Purpose**: User avatar with fallback

**Usage**:
```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/avatar.png" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### Dialog
**Location**: `components/ui/dialog.tsx`

**Purpose**: Modal dialog

**Usage**:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    Content here
  </DialogContent>
</Dialog>
```

---

### Tabs
**Location**: `components/ui/tabs.tsx`

**Purpose**: Tabbed interface

**Usage**:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

---

### Dropdown Menu
**Location**: `components/ui/dropdown-menu.tsx`

**Purpose**: Dropdown menu

**Usage**:
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Option 1</DropdownMenuItem>
    <DropdownMenuItem>Option 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Popover
**Location**: `components/ui/popover.tsx`

**Purpose**: Floating popover content

**Usage**:
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

<Popover>
  <PopoverTrigger>Trigger</PopoverTrigger>
  <PopoverContent>Popover content</PopoverContent>
</Popover>
```

---

### Switch
**Location**: `components/ui/switch.tsx`

**Purpose**: Toggle switch

**Usage**:
```tsx
import { Switch } from "@/components/ui/switch";

<Switch 
  checked={checked}
  onCheckedChange={setChecked}
/>
```

---

### Label
**Location**: `components/ui/label.tsx`

**Purpose**: Form label

**Usage**:
```tsx
import { Label } from "@/components/ui/label";

<Label htmlFor="input">Label Text</Label>
<Input id="input" />
```

---

### Textarea
**Location**: `components/ui/textarea.tsx`

**Purpose**: Multi-line text input

**Usage**:
```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea 
  placeholder="Enter text"
  rows={5}
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

### Slider
**Location**: `components/ui/slider.tsx`

**Purpose**: Range slider input

**Usage**:
```tsx
import { Slider } from "@/components/ui/slider";

<Slider 
  min={0}
  max={100}
  step={1}
  value={[value]}
  onValueChange={(v) => setValue(v[0])}
/>
```

---

## Helper Utilities

### Date/Time Helpers
```tsx
import { 
  formatDate, 
  formatTime, 
  formatDateTime,
  getDayName,
  getWeekNumber 
} from "@/lib/helpers";

formatDate(new Date()); // "Dec 8, 2024"
formatTime(new Date()); // "2:45:30 PM"
getDayName(new Date()); // "Monday"
```

### Text Helpers
```tsx
import { 
  truncateText, 
  capitalize, 
  getInitials,
  getEmailInitials 
} from "@/lib/helpers";

truncateText("Long text", 10); // "Long tex..."
capitalize("hello"); // "Hello"
getInitials("John Doe"); // "JD"
```

### Attendance Helpers
```tsx
import { 
  calculateAttendancePercentage,
  getAttendanceStatusColor 
} from "@/lib/helpers";

calculateAttendancePercentage(45, 50); // 90
getAttendanceStatusColor("present"); // "bg-green-100 text-green-800"
```

### Array Helpers
```tsx
import { 
  groupBy, 
  flatten, 
  removeDuplicates,
  sortByKey 
} from "@/lib/helpers";

groupBy(items, (item) => item.category);
flatten([[1, 2], [3, 4]]); // [1, 2, 3, 4]
removeDuplicates(items, (item) => item.id);
sortByKey(items, 'name', 'asc');
```

### Performance Helpers
```tsx
import { debounce, throttle, sleep } from "@/lib/helpers";

const debouncedSearch = debounce(search, 300);
const throttledScroll = throttle(handleScroll, 100);
await sleep(1000); // Wait 1 second
```

---

## Common Patterns

### Form with Validation
```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function Form() {
  const [data, setData] = useState({ email: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    // Submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
        {errors.name && <p className="text-red-600">{errors.name}</p>}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Dashboard Page
```tsx
import { TopBar } from "@/components/dashboard/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="w-full">
      <TopBar title="Page Title" subtitle="Subtitle" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Stats cards */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### List with Filters
```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function List() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const items = []; // Your data

  const filtered = items.filter(item => {
    const matchesSearch = item.name.includes(search);
    const matchesFilter = filter === "all" || item.category === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input 
          placeholder="Search..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Render filtered items */}
    </div>
  );
}
```

---

## Icons

All icons from **Lucide React** are available:

```tsx
import { Users, Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";

<Users className="h-5 w-5" />
```

Check [lucide.dev](https://lucide.dev) for all available icons.

---

## Tips & Best Practices

1. **Always use UI components** - Maintains consistency
2. **Leverage helpers** - DRY principle
3. **Use TypeScript** - Type safety
4. **Component composition** - Small, reusable components
5. **Prop drilling** - Use Context for shared state
6. **Responsive classes** - Use Tailwind breakpoints
7. **Accessibility** - Add ARIA labels
8. **Performance** - Use React DevTools
9. **Testing** - Write tests for components
10. **Documentation** - Keep comments updated

---

**Last Updated**: December 8, 2024  
**Version**: 1.0.0
