import { useState, useEffect } from "react";

import { useRouter } from "next/router";
import {
  FiTruck,
  FiPackage,
  FiShoppingCart,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiUser,
  FiCheck,
  FiX,
  FiEye,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiDownload,
  FiAlertCircle,
  FiInfo,
  FiFileText,
  FiActivity,
  FiStar,
  FiHeart,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";
import { CiPill } from "react-icons/ci";
import {
  MdLocalShipping,
  MdVerifiedUser,
  MdShoppingBag,
  MdHistory,
  MdHealthAndSafety,
  MdMedicalServices,
  MdSecurity,
  MdEmergency,
  MdLocalHospital,
  MdBiotech,
  MdMonitorHeart,
  MdLocalPharmacy,
} from "react-icons/md";
import {
  FaUserMd,
  FaStethoscope,
  FaHospitalUser,
  FaPrescriptionBottleAlt,
  FaHeartbeat,
  FaNotesMedical,
  FaAmbulance,
  FaSyringe,
  FaUserNurse,
  FaMicroscope,
  FaPills,
  FaPharmacy,
  FaShippingFast,
  FaBoxOpen,
  FaClock,
} from "react-icons/fa";
import { Card, Button, Input, Select, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { useHealthcareContract } from "../../hooks/useFabricAPI";
import { useAuth } from "../../context/AuthContext";
import ipfsService from "../../utils/ipfs";
import { truncateAddress, safeNumberConversion } from "../../utils/helpers";
import toast from "react-hot-toast";

const OrderCard = ({ order, medicine, onViewDetails, onReorder }) => {
  const [medicineData, setMedicineData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMedicineData = async () => {
      if (medicine?.IPFS_URL) {
        try {
          setLoading(true);
          let hash = medicine.IPFS_URL;
          if (hash.includes("/ipfs/")) {
            hash = hash.split("/ipfs/")[1];
          }
          const data = await ipfsService.fetchFromIPFS(hash);
          setMedicineData(data);
        } catch (error) {
          console.error("Error fetching medicine data:", error);
          setMedicineData({
            name: `Medicine #${safeNumberConversion(order.medicineId)}`,
          });
        } finally {
          setLoading(false);
        }
      } else {
        setMedicineData({
          name: `Medicine #${safeNumberConversion(order.medicineId)}`,
        });
      }
    };

    fetchMedicineData();
  }, [medicine?.IPFS_URL, order.medicineId]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
            <FiCheckCircle className="w-3 h-3 mr-1" />
            Delivered
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none">
            <FaBoxOpen className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case "shipped":
        return (
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none">
            <FaShippingFast className="w-3 h-3 mr-1" />
            Shipped
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-none">
            <FiX className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
            <FiCheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
    }
  };

  const formatPrice = (price) => {
    try {
      if (!price) return 0;
      return parseFloat(price || 0);
    } catch (error) {
      console.error("Error formatting price:", error);
      return 0;
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(safeNumberConversion(timestamp) * 1000);
      return date.toLocaleDateString();
    } catch {
      return new Date().toLocaleDateString();
    }
  };

  const totalAmount = formatPrice(order.payAmount);
  const quantity = safeNumberConversion(order.quantity) || 1;
  const unitPrice = quantity > 0 ? totalAmount / quantity : 0;

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              {loading ? (
                <LoadingSpinner size="small" />
              ) : medicineData?.medicineImage ? (
                <img
                  src={ipfsService.getIPFSUrl(medicineData.medicineImage)}
                  alt={medicineData?.name || "Medicine"}
                  className="w-full h-full object-cover rounded-xl border-2 border-white"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML =
                      '<div class="h-8 w-8 text-white"><svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>';
                  }}
                />
              ) : medicineData?.images && medicineData.images.length > 0 ? (
                <img
                  src={ipfsService.getIPFSUrl(medicineData.images[0])}
                  alt={medicineData?.name || "Medicine"}
                  className="w-full h-full object-cover rounded-xl border-2 border-white"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML =
                      '<div class="h-8 w-8 text-white"><svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>';
                  }}
                />
              ) : (
                <FaPrescriptionBottleAlt className="h-8 w-8 text-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {medicineData?.name ||
                    `Medicine #${safeNumberConversion(order.medicineId)}`}
                </h3>
                {getStatusBadge(order.status || "completed")}
              </div>

              {medicineData?.category && (
                <p className="text-sm text-teal-600 capitalize mb-3 font-medium">
                  {medicineData.category}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3 flex-wrap">
                <div className="flex items-center bg-white p-2 rounded-lg border border-teal-200">
                  <FiCalendar className="h-4 w-4 mr-2 text-teal-600" />
                  <span className="font-medium">{formatDate(order.date)}</span>
                </div>
                <div className="flex items-center bg-white p-2 rounded-lg border border-teal-200">
                  <FaPills className="h-4 w-4 mr-2 text-teal-600" />
                  <span className="font-medium">Qty: {quantity}</span>
                </div>
                {medicine?.currentLocation && (
                  <div className="flex items-center bg-white p-2 rounded-lg border border-teal-200">
                    <FiMapPin className="h-4 w-4 mr-2 text-teal-600" />
                    <span className="font-medium">
                      {medicine.currentLocation}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center bg-white p-2 rounded-lg border border-cyan-200">
                  <FaNotesMedical className="h-4 w-4 mr-2 text-cyan-600" />
                  <span className="text-gray-600 font-medium">
                    Medicine ID: #{safeNumberConversion(order.medicineId)}
                  </span>
                </div>
                <div className="flex items-center bg-white p-2 rounded-lg border border-cyan-200">
                  <FaHospitalUser className="h-4 w-4 mr-2 text-cyan-600" />
                  <span className="text-gray-600 font-medium">
                    Patient ID: #{safeNumberConversion(order.patientId)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="mb-3">
              <p className="text-2xl font-bold text-teal-600">
                {totalAmount.toFixed(4)} ETH
              </p>
              <p className="text-sm text-gray-500 font-medium">
                {unitPrice.toFixed(4)} ETH per unit
              </p>
            </div>
          </div>
        </div>

        {/* Medicine Details */}
        {medicineData && (medicineData.manufacturer || medicineData.dosage) && (
          <div className="bg-white rounded-xl p-4 mb-6 border-2 border-teal-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {medicineData.manufacturer && (
                <div className="flex justify-between items-center p-2 bg-teal-50 rounded-lg">
                  <span className="font-bold text-teal-700 uppercase tracking-wide text-xs">
                    Manufacturer:
                  </span>
                  <span className="text-gray-700 font-medium">
                    {medicineData.manufacturer}
                  </span>
                </div>
              )}
              {medicineData.dosage && (
                <div className="flex justify-between items-center p-2 bg-teal-50 rounded-lg">
                  <span className="font-bold text-teal-700 uppercase tracking-wide text-xs">
                    Dosage:
                  </span>
                  <span className="text-gray-700 font-medium">
                    {medicineData.dosage}
                  </span>
                </div>
              )}
              {medicineData.activeIngredient && (
                <div className="flex justify-between items-center p-2 bg-teal-50 rounded-lg">
                  <span className="font-bold text-teal-700 uppercase tracking-wide text-xs">
                    Active Ingredient:
                  </span>
                  <span className="text-gray-700 font-medium">
                    {medicineData.activeIngredient}
                  </span>
                </div>
              )}
              {medicineData.expiryDate && (
                <div className="flex justify-between items-center p-2 bg-teal-50 rounded-lg">
                  <span className="font-bold text-teal-700 uppercase tracking-wide text-xs">
                    Expiry:
                  </span>
                  <span className="text-gray-700 font-medium">
                    {medicineData.expiryDate}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Timeline */}
        <div className="mb-6">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdLocalShipping className="h-5 w-5 text-teal-600" />
            Order Timeline
          </h4>
          <div className="space-y-3">
            {[
              { label: "Order Placed", icon: FiShoppingCart },
              { label: "Payment Confirmed", icon: FiCheckCircle },
              { label: "Medicine Dispensed", icon: FaPills },
              { label: "Delivered", icon: FaShippingFast },
            ].map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <step.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {step.label}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {formatDate(order.date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t-2 border-teal-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center bg-white p-2 rounded-lg border border-teal-200">
              <FaNotesMedical className="h-4 w-4 mr-2 text-teal-600" />
              <span className="font-medium">
                Order ID: #{safeNumberConversion(order.medicineId)}-
                {safeNumberConversion(order.patientId)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="small"
              onClick={() => onViewDetails(order)}
              className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
            >
              <FiEye className="h-4 w-4 mr-1" />
              Details
            </Button>

            {medicine?.active &&
              safeNumberConversion(medicine?.quantity || 0) > 0 && (
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => onReorder(order, medicine)}
                  className="border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                >
                  <FiRefreshCw className="h-4 w-4 mr-1" />
                  Reorder
                </Button>
              )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const OrderSummaryCard = ({ orders, medicines }) => {
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => {
    const amount = parseFloat(order.payAmount || 0 || 0);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  const totalItems = orders.reduce(
    (sum, order) => sum + safeNumberConversion(order.quantity || 1),
    0
  );

  const recentOrder = orders.length > 0 ? orders[orders.length - 1] : null;
  const recentMedicine = recentOrder
    ? medicines.find(
        (m) =>
          safeNumberConversion(m.id) ===
          safeNumberConversion(recentOrder.medicineId)
      )
    : null;

  const formatDate = (timestamp) => {
    try {
      const date = new Date(safeNumberConversion(timestamp) * 1000);
      return date.toLocaleDateString();
    } catch {
      return new Date().toLocaleDateString();
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MdShoppingBag className="h-6 w-6 text-blue-600" />
            Order Summary
          </h3>
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
            <MdLocalPharmacy className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            {
              title: "Total Orders",
              value: totalOrders,
              icon: MdShoppingBag,
              color: "blue",
            },
            {
              title: "Items Purchased",
              value: totalItems,
              icon: FaPills,
              color: "purple",
            },
            {
              title: "Total Spent",
              value: `${totalSpent.toFixed(4)} ETH`,
              icon: FiDollarSign,
              color: "emerald",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-4 bg-white rounded-xl border-2 border-blue-200"
            >
              <div
                className={`p-3 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-xl w-fit mx-auto mb-3 shadow-lg`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className={`text-2xl font-bold text-${stat.color}-600 mb-1`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
            </div>
          ))}
        </div>

        {recentOrder && (
          <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FaClock className="h-4 w-4 text-blue-600" />
              Most Recent Order
            </h4>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <FaPrescriptionBottleAlt className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">
                  Medicine #{safeNumberConversion(recentOrder.medicineId)}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  Qty: {safeNumberConversion(recentOrder.quantity)} •
                  {parseFloat(recentOrder.payAmount || 0 || 0).toFixed(
                    4
                  )}{" "}
                  ETH •{formatDate(recentOrder.date)}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none text-xs">
                <FiCheckCircle className="w-3 h-3 mr-1" />
                Delivered
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const PatientOrders = () => {
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { user: fabricUser } = useAuth();
  const isConnected = !!fabricUser;
  const address = fabricUser?.userId || fabricUser?.email || '';
  const router = useRouter();
  const {
    getPatientId,
    getPatientDetails,
    getPatientOrders,
    getAllMedicines,
    buyMedicine,
    getUserType,
  } = useHealthcareContract();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Always try to get medicines first
        const allMedicines = await getAllMedicines();
        console.log("Medicines loaded:", allMedicines);
        setMedicines(allMedicines || []);

        // Only fetch patient data if connected
        if (isConnected && address) {
          try {
            // Check if user is a patient
            const userInfo = await getUserType(address);
            console.log("User info:", userInfo);

            if (userInfo && userInfo.userType === "patient") {
              // Get patient data
              const patientId = await getPatientId(address);
              console.log("Patient ID:", patientId);

              if (patientId) {
                const [patientDetails, patientOrders] = await Promise.all([
                  getPatientDetails(patientId),
                  getPatientOrders(patientId),
                ]);

                console.log("Patient orders data loaded:", {
                  patientDetails,
                  ordersCount: patientOrders?.length,
                });

                setPatientData({
                  ...patientDetails,
                  id: patientId,
                });
                setOrders(patientOrders || []);
              } else {
                console.warn("Patient ID not found");
                toast.error("Patient not found. Please register first.");
              }
            } else {
              console.warn("User is not a patient");
              toast.error("Please register as a patient first");
            }
          } catch (error) {
            console.error("Error fetching patient data:", error);
            toast.error("Failed to load patient data");
          }
        } else {
          console.log("Wallet not connected");
          toast.info("Connect your wallet to view your orders");
        }
      } catch (error) {
        console.error("Error fetching orders data:", error);
        toast.error("Failed to load orders data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isConnected, address]);

  const handleViewOrderDetails = (order) => {
    console.log("View order details:", order);
  };

  const handleReorderMedicine = async (order, medicine) => {
    if (!patientData) {
      toast.error("Patient data not loaded");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet to reorder");
      return;
    }

    try {
      const quantity = safeNumberConversion(order.quantity) || 1;
      const price = parseFloat(medicine.price || 0 || 0);
      const discount = safeNumberConversion(medicine.discount) || 0;
      const discountedPrice = price * (1 - discount / 100);
      const totalPrice = discountedPrice * quantity;

      console.log("Reordering medicine:", {
        patientId: safeNumberConversion(patientData.id),
        medicineId: safeNumberConversion(medicine.id),
        quantity,
        totalPrice,
      });

      await buyMedicine(
        safeNumberConversion(patientData.id),
        safeNumberConversion(medicine.id),
        quantity,
        totalPrice
      );

      toast.success("Medicine reordered successfully!");

      // Refresh orders and medicines data
      const [updatedOrders, updatedMedicines] = await Promise.all([
        getPatientOrders(safeNumberConversion(patientData.id)),
        getAllMedicines(),
      ]);

      setOrders(updatedOrders || []);
      setMedicines(updatedMedicines || []);
    } catch (error) {
      console.error("Error reordering medicine:", error);

      if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient ETH balance for reorder");
      } else if (error?.message?.includes("Not enough medicine in stock")) {
        toast.error("Insufficient stock for reorder");
      } else if (error?.message?.includes("Medicine is not active")) {
        toast.error("This medicine is currently unavailable");
      } else {
        toast.error("Failed to reorder medicine");
      }
    }
  };

  const handleExportOrders = () => {
    try {
      // Create CSV data
      const csvData = [
        [
          "Order ID",
          "Medicine ID",
          "Quantity",
          "Amount (ETH)",
          "Date",
          "Status",
        ],
        ...orders.map((order) => [
          safeNumberConversion(order.medicineId) +
            "-" +
            safeNumberConversion(order.patientId),
          safeNumberConversion(order.medicineId),
          safeNumberConversion(order.quantity),
          parseFloat(order.payAmount || 0 || 0).toFixed(4),
          new Date(
            safeNumberConversion(order.date) * 1000
          ).toLocaleDateString(),
          "Completed",
        ]),
      ];

      // Convert to CSV string
      const csvString = csvData.map((row) => row.join(",")).join("\n");

      // Create and download file
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `patient_orders_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Orders exported successfully!");
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast.error("Failed to export orders");
    }
  };

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter((order) => {
      const medicineId = safeNumberConversion(order.medicineId).toString();
      const medicine = medicines.find(
        (m) =>
          safeNumberConversion(m.id) === safeNumberConversion(order.medicineId)
      );

      const matchesSearch =
        !searchTerm ||
        medicineId.includes(searchTerm.toLowerCase()) ||
        safeNumberConversion(order.patientId)
          .toString()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "delivered" &&
          (!order.status || order.status === "completed")) ||
        order.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return safeNumberConversion(b.date) - safeNumberConversion(a.date);
        case "oldest":
          return safeNumberConversion(a.date) - safeNumberConversion(b.date);
        case "amount-high":
          return (
            parseFloat(b.payAmount || 0 || 0) -
            parseFloat(a.payAmount || 0 || 0)
          );
        case "amount-low":
          return (
            parseFloat(a.payAmount || 0 || 0) -
            parseFloat(b.payAmount || 0 || 0)
          );
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl">
              <MdShoppingBag className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
          <p className="text-sm text-gray-500">Retrieving your order history</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full w-fit mx-auto shadow-lg">
                <FiUser className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <MdSecurity className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <MdSecurity className="h-5 w-5 text-yellow-600" />
              Wallet Not Connected
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Please connect your wallet to view your medicine orders and
              purchase history.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 w-full"
              >
                <MdSecurity className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600">
                <MdHealthAndSafety className="h-4 w-4" />
                <span>Secure Healthcare Network Required</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="p-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full w-fit mx-auto shadow-lg">
                <FaHospitalUser className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <MdEmergency className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <MdHealthAndSafety className="h-5 w-5 text-red-600" />
              Patient Registration Required
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              You need to register as a patient to view your medicine orders and
              purchase history.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/patient/register")}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 w-full"
              >
                <FaHospitalUser className="mr-2 h-4 w-4" />
                Register as Patient
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm text-red-600">
                <MdSecurity className="h-4 w-4" />
                <span>Medical Registration Required</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdShoppingBag className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaHeartbeat className="absolute bottom-20 left-20 h-24 w-24 text-cyan-600" />
        <MdLocalHospital className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-teal-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center justify-between relative z-10 mb-6">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
              <MdShoppingBag className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                My Orders
                <MdHealthAndSafety className="h-8 w-8" />
              </h1>
              <p className="text-teal-100 text-lg flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Track your medicine orders and purchase history
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleExportOrders}
              disabled={orders.length === 0}
              className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
            >
              <FiDownload className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/patient/dashboard")}
              className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Info */}
      <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
              <FiCheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <MdVerifiedUser className="h-5 w-5" />
                Patient Account Active
              </h3>
              <p className="text-emerald-700 flex items-center gap-2">
                <FaHospitalUser className="h-4 w-4" />
                Patient ID: #{safeNumberConversion(patientData.id)} • Account:{" "}
                {truncateAddress(patientData.accountAddress)} • {orders.length}{" "}
                total orders
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Order Summary */}
      {orders.length > 0 && (
        <OrderSummaryCard orders={orders} medicines={medicines} />
      )}

      {/* Filters and Search */}
      {orders.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiSearch className="h-6 w-6 text-indigo-600" />
              Search & Filter Orders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-indigo-700 mb-2 uppercase tracking-wide">
                  Sort By
                </label>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-2 border-indigo-200 focus:border-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setDateFilter("");
                    setSortBy("newest");
                  }}
                  className="w-full border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  <FiRefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-white rounded-xl border-2 border-indigo-200">
              <div className="flex items-center justify-between text-sm">
                <p className="font-bold text-indigo-900">
                  Showing {filteredAndSortedOrders.length} of {orders.length}{" "}
                  orders
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Orders List */}
      {filteredAndSortedOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredAndSortedOrders.map((order, index) => {
            const medicine = medicines.find(
              (m) =>
                safeNumberConversion(m.id) ===
                safeNumberConversion(order.medicineId)
            );

            return (
              <OrderCard
                key={`${safeNumberConversion(
                  order.medicineId
                )}-${safeNumberConversion(order.patientId)}-${index}`}
                order={order}
                medicine={medicine}
                onViewDetails={handleViewOrderDetails}
                onReorder={handleReorderMedicine}
              />
            );
          })}
        </div>
      ) : orders.length === 0 ? (
        <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200">
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="p-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full w-fit mx-auto shadow-2xl">
                <MdShoppingBag className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center shadow-lg">
                <MdHealthAndSafety className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No orders yet
            </h3>
            <p className="text-gray-600 mb-8 leading-relaxed max-w-md mx-auto">
              Your medicine orders will appear here after purchases.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/patient/medicines")}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-xl"
              >
                <FiShoppingCart className="h-4 w-4 mr-2" />
                Browse Medicines
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/patient/prescriptions")}
                className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <FaNotesMedical className="h-4 w-4 mr-2" />
                View Prescriptions
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200">
          <div className="text-center py-12">
            <div className="p-6 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full w-fit mx-auto mb-6 shadow-lg">
              <FiSearch className="h-16 w-16 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              No orders found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters to see more results.
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setSortBy("newest");
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      {orders.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MdMedicalServices className="h-6 w-6 text-purple-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                onClick={() => router.push("/patient/medicines")}
              >
                <FiShoppingCart className="h-4 w-4 mr-3" />
                Browse More Medicines
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => router.push("/patient/prescriptions")}
              >
                <FaNotesMedical className="h-4 w-4 mr-3" />
                View Prescriptions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                onClick={() => router.push("/patient/book-appointment")}
              >
                <FiCalendar className="h-4 w-4 mr-3" />
                Book Appointment
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PatientOrders;
