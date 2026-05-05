const KEY_PHONE = "customer_phone";
const KEY_NAME = "customer_name";
const KEY_ADDRESS = "customer_address";
const KEY_NEIGHBORHOOD = "customer_neighborhood";

export interface CustomerProfile {
  phone: string;
  name: string;
  address: string;
  neighborhood: string;
}

export function getCustomer(): CustomerProfile {
  try {
    return {
      phone: localStorage.getItem(KEY_PHONE) || "",
      name: localStorage.getItem(KEY_NAME) || "",
      address: localStorage.getItem(KEY_ADDRESS) || "",
      neighborhood: localStorage.getItem(KEY_NEIGHBORHOOD) || "",
    };
  } catch {
    return { phone: "", name: "", address: "", neighborhood: "" };
  }
}

export function saveCustomer(c: Partial<CustomerProfile>) {
  try {
    if (c.phone !== undefined) localStorage.setItem(KEY_PHONE, c.phone);
    if (c.name !== undefined) localStorage.setItem(KEY_NAME, c.name);
    if (c.address !== undefined) localStorage.setItem(KEY_ADDRESS, c.address);
    if (c.neighborhood !== undefined) localStorage.setItem(KEY_NEIGHBORHOOD, c.neighborhood);
  } catch {
    // ignore
  }
}

export function clearCustomer() {
  try {
    localStorage.removeItem(KEY_PHONE);
    localStorage.removeItem(KEY_NAME);
    localStorage.removeItem(KEY_ADDRESS);
    localStorage.removeItem(KEY_NEIGHBORHOOD);
  } catch {
    // ignore
  }
}
