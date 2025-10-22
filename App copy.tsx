import React, { JSX, useEffect, useState } from "react";

/**
 * Chef Christoffel's Menu Management App - TypeScript (.tsx)
 * - Tailwind classes kept for styling
 * - localStorage persistence
 * - Home / Manage / Guest screens
 * - Add / Remove menu items
 */

/* ---------- Types ---------- */
type Course = "Starters" | "Mains" | "Desserts";
type Route = "home" | "manage" | "guest";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  course: Course;
  price: number;
}

/* ---------- Constants ---------- */
const COURSES: Course[] = ["Starters", "Mains", "Desserts"];
const STORAGE_KEY = "chef_menu_items";

/* ---------- Generic localStorage hook ---------- */
function useLocalStorageState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch (e) {
      console.error("localStorage read error", e);
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error("localStorage write error", e);
    }
  }, [key, state]);

  return [state, setState];
}

/* ---------- App Component ---------- */
export default function App(): JSX.Element {
  const [items, setItems] = useLocalStorageState<MenuItem[]>(STORAGE_KEY, []);
  const [route, setRoute] = useState<Route>("home");
  const [guestFilter, setGuestFilter] = useState<string>("All");

  function addItem(item: Omit<MenuItem, "id">) {
    setItems((prev) => [...prev, { ...item, id: Date.now() }]);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearAll() {
    if (confirm("Clear ALL menu items?")) setItems([]);
  }

  const totals = items.length;

  const averagesByCourse = COURSES.reduce<Record<Course, number>>(
    (acc, course) => {
      const list = items.filter((i) => i.course === course);
      const avg = list.length
        ? list.reduce((s, it) => s + Number(it.price), 0) / list.length
        : 0;
      acc[course] = Number(avg.toFixed(2));
      return acc;
    },
    {
      Starters: 0,
      Mains: 0,
      Desserts: 0,
    }
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-bold">Chef Christoffel's Menu App</h1>
          <nav className="space-x-2">
            <button
              onClick={() => setRoute("home")}
              className="px-3 py-1 rounded hover:bg-gray-100"
            >
              Home
            </button>
            <button
              onClick={() => setRoute("manage")}
              className="px-3 py-1 rounded hover:bg-gray-100"
            >
              Manage Menu
            </button>
            <button
              onClick={() => setRoute("guest")}
              className="px-3 py-1 rounded hover:bg-gray-100"
            >
              Guest View
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1 rounded text-red-600 hover:bg-red-50"
            >
              Clear
            </button>
          </nav>
        </header>

        <main className="p-6">
          {route === "home" && (
            <HomeScreen
              items={items}
              totals={totals}
              averagesByCourse={averagesByCourse}
            />
          )}

          {route === "manage" && (
            <ManageScreen
              items={items}
              addItem={addItem}
              removeItem={removeItem}
            />
          )}

          {route === "guest" && (
            <GuestScreen
              items={items}
              guestFilter={guestFilter}
              setGuestFilter={setGuestFilter}
            />
          )}
        </main>

        <footer className="p-4 text-sm text-gray-500 border-t">
          Saved to localStorage. Refresh keeps your menu.
        </footer>
      </div>
    </div>
  );
}

/* ---------- HomeScreen ---------- */
interface HomeScreenProps {
  items: MenuItem[];
  totals: number;
  averagesByCourse: Record<Course, number>;
}

function HomeScreen({
  items,
  totals,
  averagesByCourse,
}: HomeScreenProps): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Complete Menu</h2>
        <div className="text-right">
          <div>
            Total items: <span className="font-bold">{totals}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {COURSES.map((course) => (
          <div key={course} className="p-4 border rounded">
            <div className="text-sm text-gray-500">{course}</div>
            <div className="text-lg font-bold">
              R {averagesByCourse[course].toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">average price</div>
          </div>
        ))}
      </div>

      <MenuList items={items} />
    </div>
  );
}

/* ---------- ManageScreen ---------- */
interface ManageScreenProps {
  items: MenuItem[];
  addItem: (item: Omit<MenuItem, "id">) => void;
  removeItem: (id: number) => void;
}

function ManageScreen({
  items,
  addItem,
  removeItem,
}: ManageScreenProps): JSX.Element {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Menu Items</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <AddItemForm onAdd={addItem} />
        </div>

        <div>
          <h3 className="font-medium mb-2">Current Items</h3>
          <MenuList items={items} showRemove onRemove={removeItem} />
        </div>
      </div>
    </div>
  );
}

/* ---------- GuestScreen ---------- */
interface GuestScreenProps {
  items: MenuItem[];
  guestFilter: string;
  setGuestFilter: (value: string) => void;
}

function GuestScreen({
  items,
  guestFilter,
  setGuestFilter,
}: GuestScreenProps): JSX.Element {
  const filtered =
    guestFilter === "All"
      ? items
      : items.filter((i) => i.course === guestFilter);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Guest Menu View</h2>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm">Filter by course:</label>
        <select
          value={guestFilter}
          onChange={(e) => setGuestFilter(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option>All</option>
          {COURSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <MenuList items={filtered} />
    </div>
  );
}

/* ---------- MenuList ---------- */
interface MenuListProps {
  items: MenuItem[];
  showRemove?: boolean;
  onRemove?: (id: number) => void;
}

function MenuList({
  items,
  showRemove = false,
  onRemove,
}: MenuListProps): JSX.Element {
  if (!items.length)
    return <div className="text-gray-500">No items in the menu yet.</div>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li
          key={it.id}
          className="p-3 border rounded flex justify-between items-start"
        >
          <div>
            <div className="font-semibold text-lg">
              {it.name}{" "}
              <span className="text-sm text-gray-500">— {it.course}</span>
            </div>
            <div className="text-sm text-gray-600">{it.description}</div>
            <div className="mt-2 font-bold">
              R {Number(it.price).toFixed(2)}
            </div>
          </div>
          {showRemove && onRemove && (
            <div>
              <button
                onClick={() => onRemove(it.id)}
                className="px-3 py-1 rounded bg-red-50 text-red-600"
              >
                Remove
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------- AddItemForm ---------- */
interface AddItemFormProps {
  onAdd: (item: Omit<MenuItem, "id">) => void;
}

function AddItemForm({ onAdd }: AddItemFormProps): JSX.Element {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [course, setCourse] = useState<Course>(COURSES[0]);
  const [price, setPrice] = useState<string>("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!name.trim()) return alert("Dish name required");
    if (!description.trim()) return alert("Description required");
    if (!price || Number(price) <= 0) return alert("Enter a valid price");

    onAdd({
      name: name.trim(),
      description: description.trim(),
      course,
      price: Number(price),
    });

    setName("");
    setDescription("");
    setCourse(COURSES[0]);
    setPrice("");
  }

  return (
    <form onSubmit={submit} className="space-y-3 border rounded p-4">
      <div>
        <label className="block text-sm font-medium">Dish name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Course</label>
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value as Course)}
            className="w-full border rounded px-3 py-2"
          >
            {COURSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Price (R)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded px-3 py-2"
            type="number"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Add Dish
        </button>
      </div>
    </form>
  );
}
