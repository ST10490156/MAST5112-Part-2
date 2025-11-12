import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Course = "Starters" | "Mains" | "Desserts";
type Route = "home" | "manage" | "guest";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  course: Course;
  price: number;
}

const COURSES: Course[] = ["Starters", "Mains", "Desserts"];
const STORAGE_KEY = "chef_menu_items";

/* ---------- useAsyncStorageState Hook ---------- */
function useAsyncStorageState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) setState(JSON.parse(raw));
      } catch (e) {
        console.error("AsyncStorage read error", e);
      }
    })();
  }, [key]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.error("AsyncStorage write error", e);
      }
    })();
  }, [key, state]);

  return [state, setState];
}

/* ---------- App Component ---------- */
export default function App(): JSX.Element {
  const [items, setItems] = useAsyncStorageState<MenuItem[]>(STORAGE_KEY, []);
  const [route, setRoute] = useState<Route>("home");
  const [guestFilter, setGuestFilter] = useState<string>("All");

  function addItem(item: Omit<MenuItem, "id">) {
    setItems((prev) => [...prev, { ...item, id: Date.now() }]);
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearAll() {
    Alert.alert("Confirm", "Clear ALL menu items?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: () => setItems([]) },
    ]);
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
    { Starters: 0, Mains: 0, Desserts: 0 }
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Chef Christoffel’s Menu App</Text>

      <View style={styles.nav}>
        <Button title="Home" onPress={() => setRoute("home")} />
        <Button title="Manage Menu" onPress={() => setRoute("manage")} />
        <Button title="Guest View" onPress={() => setRoute("guest")} />
        <Button title="Clear" color="red" onPress={clearAll} />
      </View>

      {route === "home" && (
        <HomeScreen
          items={items}
          totals={totals}
          averagesByCourse={averagesByCourse}
        />
      )}

      {route === "manage" && (
        <ManageScreen items={items} addItem={addItem} removeItem={removeItem} />
      )}

      {route === "guest" && (
        <GuestScreen
          items={items}
          guestFilter={guestFilter}
          setGuestFilter={setGuestFilter}
        />
      )}

      <Text style={styles.footer}>
        Data is saved to your device storage automatically.
      </Text>
    </ScrollView>
  );
}

/* ---------- Home Screen ---------- */
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
    <View style={styles.section}>
      <Text style={styles.subheader}>Complete Menu</Text>
      <Text>Total items: {totals}</Text>

      {COURSES.map((course) => (
        <View key={course} style={styles.card}>
          <Text style={styles.bold}>{course}</Text>
          <Text>Average Price: R {averagesByCourse[course].toFixed(2)}</Text>
        </View>
      ))}

      <MenuList items={items} />
    </View>
  );
}

/* ---------- Manage Screen ---------- */
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
    <View style={styles.section}>
      <Text style={styles.subheader}>Manage Menu Items</Text>
      <AddItemForm onAdd={addItem} />
      <MenuList items={items} showRemove onRemove={removeItem} />
    </View>
  );
}

/* ---------- Guest Screen ---------- */
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
    <View style={styles.section}>
      <Text style={styles.subheader}>Guest Menu View</Text>
      <Text>Filter by course:</Text>
      {["All", ...COURSES].map((c) => (
        <TouchableOpacity key={c} onPress={() => setGuestFilter(c)}>
          <Text
            style={[
              styles.filter,
              guestFilter === c && { fontWeight: "bold", color: "blue" },
            ]}
          >
            {c}
          </Text>
        </TouchableOpacity>
      ))}
      <MenuList items={filtered} />
    </View>
  );
}

/* ---------- Menu List ---------- */
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
    return <Text style={styles.gray}>No items in the menu yet.</Text>;

  return (
    <View style={{ marginTop: 10 }}>
      {items.map((it) => (
        <View key={it.id} style={styles.menuItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bold}>
              {it.name} — <Text style={styles.gray}>{it.course}</Text>
            </Text>
            <Text>{it.description}</Text>
            <Text style={styles.price}>R {it.price.toFixed(2)}</Text>
          </View>
          {showRemove && onRemove && (
            <Button title="Remove" color="red" onPress={() => onRemove(it.id)} />
          )}
        </View>
      ))}
    </View>
  );
}

/* ---------- Add Item Form ---------- */
interface AddItemFormProps {
  onAdd: (item: Omit<MenuItem, "id">) => void;
}

function AddItemForm({ onAdd }: AddItemFormProps): JSX.Element {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState<Course>("Starters");
  const [price, setPrice] = useState("");

  function submit() {
    if (!name.trim() || !description.trim() || !price)
      return Alert.alert("Error", "Please fill in all fields.");
    const newItem: Omit<MenuItem, "id"> = {
      name: name.trim(),
      description: description.trim(),
      course,
      price: Number(price),
    };
    onAdd(newItem);
    setName("");
    setDescription("");
    setCourse("Starters");
    setPrice("");
  }

  return (
    <View style={styles.form}>
      <TextInput
        placeholder="Dish name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <Text>Course: {course}</Text>
      <View style={styles.courseRow}>
        {COURSES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCourse(c)}>
            <Text
              style={[
                styles.filter,
                course === c && { fontWeight: "bold", color: "blue" },
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        placeholder="Price (R)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title="Add Dish" onPress={submit} />
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  nav: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  section: { marginBottom: 30 },
  subheader: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  bold: { fontWeight: "bold" },
  gray: { color: "#777" },
  price: { fontWeight: "600", marginTop: 4 },
  form: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  footer: { textAlign: "center", color: "#666", marginTop: 20, fontSize: 12 },
  menuItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filter: { marginRight: 8, color: "gray" },
  courseRow: { flexDirection: "row", marginBottom: 8 },
});
