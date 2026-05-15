
import Customer from "../models/Customer.js";

export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
    const customers = await Customer.find(query).sort("-createdAt");
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
