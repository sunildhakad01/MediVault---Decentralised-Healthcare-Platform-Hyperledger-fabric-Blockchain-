import { useState, useEffect, useRef } from "react";

import { useRouter } from "next/router";
import {
  FiSend,
  FiUser,
  FiSearch,
  FiPhone,
  FiVideo,
  FiMoreVertical,
  FiArrowLeft,
  FiPaperclip,
  FiSmile,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiUserPlus,
  FiMessageCircle,
  FiInfo,
  FiRefreshCw,
  FiArrowRight,
  FiActivity,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdPersonAdd,
  MdHealthAndSafety,
  MdMedicalServices,
  MdSecurity,
  MdChat,
  MdMessage,
  MdNotifications,
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
} from "react-icons/fa";
import { Card, Button, Input, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { useHealthcareContract } from "../../hooks/useFabricAPI";
import { useAuth } from "../../context/AuthContext";
import ipfsService from "../../utils/ipfs";
import { truncateAddress } from "../../utils/helpers";
import toast from "react-hot-toast";

const ContactCard = ({
  contact,
  isSelected,
  onClick,
  userType,
  lastMessage,
}) => {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContactData = async () => {
      if (contact.IPFS_URL) {
        try {
          setLoading(true);
          const hash = contact.IPFS_URL.replace(
            "https://gateway.pinata.cloud/ipfs/",
            ""
          );
          const data = await ipfsService.fetchFromIPFS(hash);
          setContactData(data);
        } catch (error) {
          console.error("Error fetching contact data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchContactData();
  }, [contact.IPFS_URL]);

  const getContactTypeGradient = (type) => {
    switch (type) {
      case "doctor":
        return "from-blue-500 to-indigo-500";
      case "patient":
        return "from-emerald-500 to-green-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getContactIcon = (type) => {
    switch (type) {
      case "doctor":
        return <FaUserMd className="h-5 w-5 text-white" />;
      case "patient":
        return <FaHospitalUser className="h-5 w-5 text-white" />;
      default:
        return <FiUser className="h-5 w-5 text-white" />;
    }
  };

  return (
    <div
      className={`p-4 cursor-pointer transition-all duration-300 border-b border-gray-100 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 ${
        isSelected
          ? "bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-l-teal-500 shadow-md"
          : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${getContactTypeGradient(
              contact.userType
            )} shadow-lg`}
          >
            {loading ? (
              <LoadingSpinner size="small" />
            ) : contactData?.profileImage ? (
              <img
                src={ipfsService.getIPFSUrl(contactData.profileImage)}
                alt={contactData?.name || "Contact"}
                className="w-full h-full object-cover rounded-full border-2 border-white"
              />
            ) : (
              getContactIcon(contact.userType)
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-400 border-2 border-white rounded-full shadow-sm"></div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {contactData?.name ||
                contact.name ||
                `${contact.userType} #${contact.id}`}
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {lastMessage?.timestamp
                ? new Date(lastMessage.timestamp * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )
                : ""}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Badge
                className={`text-xs ${
                  contact.userType === "doctor"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none"
                    : "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none"
                }`}
              >
                <MdVerifiedUser className="w-3 h-3 mr-1" />
                {contact.userType}
              </Badge>
              {contactData?.specialization && (
                <span className="text-xs text-teal-600 font-medium">
                  {contactData.specialization}
                </span>
              )}
            </div>
          </div>

          {lastMessage && (
            <p className="text-sm text-gray-600 truncate">
              {lastMessage.sender === userType ? "You: " : ""}
              {lastMessage.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isOwn, senderInfo, timestamp }) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-lg ${
          isOwn
            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
            : "bg-white border-2 border-blue-200 text-gray-900"
        }`}
      >
        {!isOwn && senderInfo && (
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
              {senderInfo.userType === "doctor" ? (
                <FaUserMd className="h-3 w-3 text-white" />
              ) : (
                <FaHospitalUser className="h-3 w-3 text-white" />
              )}
            </div>
            <p className="text-xs text-blue-600 font-bold">
              {senderInfo.name || `${senderInfo.userType} #${senderInfo.id}`}
            </p>
          </div>
        )}
        <p className="text-sm leading-relaxed">{message}</p>
        <div
          className={`flex items-center justify-end mt-2 space-x-1 ${
            isOwn ? "text-teal-100" : "text-gray-500"
          }`}
        >
          <FiClock className="h-3 w-3" />
          <span className="text-xs font-medium">
            {timestamp
              ? new Date(Number(timestamp) * 1000).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
          {isOwn && <FiCheckCircle className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
};

const NewChatModal = ({ isOpen, onClose, contacts, onStartChat, userType }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);

  useEffect(() => {
    if (contacts) {
      const filtered = contacts.filter((contact) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.id.toString().includes(searchLower) ||
          contact.accountAddress.toLowerCase().includes(searchLower)
        );
      });
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border-2 border-teal-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                <MdChat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Start New Chat
                </h3>
                <p className="text-teal-600 font-medium">
                  Connect with healthcare professionals
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="small"
              onClick={onClose}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              <FiArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-teal-700 mb-2 uppercase tracking-wide">
              Search Healthcare Network
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400" />
              <Input
                type="text"
                placeholder="Search doctors, patients, specialists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-teal-200 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredContacts.length > 0 ? (
              <div className="space-y-3">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 cursor-pointer rounded-xl border-2 border-teal-200 hover:border-teal-300 hover:shadow-lg transition-all duration-200"
                    onClick={() => {
                      onStartChat(contact);
                      onClose();
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${
                          contact.userType === "doctor"
                            ? "from-blue-500 to-indigo-500"
                            : "from-emerald-500 to-green-500"
                        } shadow-lg`}
                      >
                        {contact.userType === "doctor" ? (
                          <FaUserMd className="h-6 w-6 text-white" />
                        ) : (
                          <FaHospitalUser className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          {contact.name || `${contact.userType} #${contact.id}`}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {truncateAddress(contact.accountAddress)}
                        </p>
                        <Badge
                          className={`text-xs mt-2 ${
                            contact.userType === "doctor"
                              ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none"
                              : "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none"
                          }`}
                        >
                          <MdVerifiedUser className="w-3 h-3 mr-1" />
                          {contact.userType}
                        </Badge>
                      </div>
                      <FiArrowRight className="h-5 w-5 text-teal-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-6 bg-gradient-to-r from-gray-400 to-blue-400 rounded-full w-fit mx-auto mb-6 shadow-lg">
                  <FiUserPlus className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No contacts found
                </h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthcareChat = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [contacts, setContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userType, setUserType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newChatModal, setNewChatModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const { user: fabricUser } = useAuth();
  const isConnected = !!fabricUser;
  const address = fabricUser?.userId || fabricUser?.email || '';
  const router = useRouter();

  const {
    getAllDoctors,
    getDoctorId,
    getPatientId,
    getDoctorDetails,
    getPatientDetails,
    getUserType,
  } = useHealthcareContract();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (!isConnected || !address) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);

        // Get user type and data
        const userInfo = await getUserType(address);
        if (!userInfo) {
          router.push("/");
          return;
        }

        setUserType(userInfo.userType);

        // Get user details
        let userId, userDetails;
        if (userInfo.userType === "doctor") {
          userId = await getDoctorId(address);
          userDetails = await getDoctorDetails(userId);
        } else if (userInfo.userType === "patient") {
          userId = await getPatientId(address);
          userDetails = await getPatientDetails(userId);
        }

        setUserData(userDetails);

        // Get friends list and all contacts
        const [friendsList, allDoctors, allPatients] = await Promise.all([
          getFriendsList(address),
          getAllDoctors(),
          getAllPatients(),
        ]);

        // Combine all potential contacts (excluding current user)
        const potentialContacts = [
          ...(allDoctors || []).filter(
            (doc) => doc.accountAddress.toLowerCase() !== address.toLowerCase()
          ),
          ...(allPatients || []).filter(
            (pat) => pat.accountAddress.toLowerCase() !== address.toLowerCase()
          ),
        ];

        setAllContacts(potentialContacts);
        setContacts(friendsList || []);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Failed to load chat data");
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [isConnected, address]);

  const loadMessages = async (contact) => {
    try {
      const chatMessages = await getChatMessages(
        contact.accountAddress,
        address
      );

      console.log(chatMessages);

      // Format messages for display
      const formattedMessages = chatMessages.map((msg) => ({
        id: `${msg.sender}-${msg.timestamp}`,
        message: msg.msg,
        sender: msg.sender,
        timestamp: msg.timestamp,
        isOwn: msg.sender.toLowerCase() === address.toLowerCase(),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const handleContactSelect = async (contact) => {
    setSelectedContact(contact);
    await loadMessages(contact);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || sendingMessage) return;

    try {
      setSendingMessage(true);

      // Add message to local state immediately for better UX
      const tempMessage = {
        id: `temp-${Date.now()}`,
        message: messageInput,
        sender: address,
        timestamp: Math.floor(Date.now() / 1000),
        isOwn: true,
      };

      setMessages((prev) => [...prev, tempMessage]);
      setMessageInput("");

      // Send message to blockchain
      await sendMessage(selectedContact.accountAddress, address, messageInput);

      // Reload messages to get the confirmed version
      await loadMessages(selectedContact);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");

      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStartNewChat = async (contact) => {
    // Add to friends list locally and start chat
    setContacts((prev) => {
      const exists = prev.some(
        (c) => c.accountAddress === contact.accountAddress
      );
      if (!exists) {
        return [...prev, contact];
      }
      return prev;
    });

    await handleContactSelect(contact);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const friendsList = await getFriendsList(address);
      setContacts(friendsList || []);

      if (selectedContact) {
        await loadMessages(selectedContact);
      }

      toast.success("Chat refreshed");
    } catch (error) {
      console.error("Error refreshing chat:", error);
      toast.error("Failed to refresh chat");
    } finally {
      setRefreshing(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.id?.toString().includes(searchLower) ||
      contact.accountAddress.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl">
              <MdChat className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">
            Loading healthcare chat...
          </p>
          <p className="text-sm text-gray-500">
            Connecting to secure messaging network
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <MdChat className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaHeartbeat className="absolute bottom-20 left-20 h-24 w-24 text-cyan-600" />
        <MdLocalHospital className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Sidebar - Contacts */}
      <div className="w-1/3 bg-white border-r-2 border-teal-200 flex flex-col shadow-xl relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="small"
                onClick={() =>
                  router.push(
                    userType === "doctor"
                      ? "/doctor/dashboard"
                      : "/patient/dashboard"
                  )
                }
                className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
              >
                <FiArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="small"
                onClick={handleRefresh}
                loading={refreshing}
                disabled={refreshing}
                className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
              >
                <FiRefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={() => setNewChatModal(true)}
                className="border-2 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-20 backdrop-blur-sm"
              >
                <FiUserPlus className="h-4 w-4 mr-1" />
                New Chat
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <MdMessage className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">Healthcare Messages</h1>
              <p className="text-teal-100 flex items-center gap-2">
                <MdSecurity className="h-4 w-4" />
                Secure medical communication
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-70" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* User Info */}
        {userData && (
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${
                  userType === "doctor"
                    ? "from-blue-500 to-indigo-500"
                    : "from-emerald-500 to-green-500"
                } shadow-lg`}
              >
                {userType === "doctor" ? (
                  <FaUserMd className="h-6 w-6 text-white" />
                ) : (
                  <FaHospitalUser className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {userData.name || `${userType} #${userData.id}`}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  {truncateAddress(address)}
                </p>
                <Badge
                  className={`text-xs mt-1 ${
                    userType === "doctor"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none"
                      : "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none"
                  }`}
                >
                  <MdVerifiedUser className="w-3 h-3 mr-1" />
                  {userType}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <ContactCard
                key={contact.accountAddress}
                contact={contact}
                isSelected={
                  selectedContact?.accountAddress === contact.accountAddress
                }
                onClick={() => handleContactSelect(contact)}
                userType={userType}
                lastMessage={null} // You can implement last message tracking
              />
            ))
          ) : (
            <div className="text-center py-16 px-6">
              <div className="p-6 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full w-fit mx-auto mb-6 shadow-lg">
                <FiMessageCircle className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {searchTerm ? "No conversations found" : "No conversations yet"}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {searchTerm
                  ? "Try adjusting your search terms to find contacts"
                  : "Start a new conversation to begin secure messaging with healthcare professionals"}
              </p>
              <Button
                onClick={() => setNewChatModal(true)}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg"
              >
                <FiUserPlus className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow-xl relative z-10">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${
                      selectedContact.userType === "doctor"
                        ? "from-blue-500 to-indigo-500"
                        : "from-emerald-500 to-green-500"
                    } shadow-lg`}
                  >
                    {selectedContact.userType === "doctor" ? (
                      <FaUserMd className="h-6 w-6 text-white" />
                    ) : (
                      <FaHospitalUser className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedContact.name ||
                        `${selectedContact.userType} #${selectedContact.id}`}
                    </h2>
                    <p className="text-sm text-blue-600 font-medium flex items-center gap-2">
                      <MdSecurity className="h-4 w-4" />
                      {truncateAddress(selectedContact.accountAddress)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge
                    className={`${
                      selectedContact.userType === "doctor"
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-none"
                        : "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none"
                    }`}
                  >
                    <MdVerifiedUser className="w-3 h-3 mr-1" />
                    {selectedContact.userType}
                  </Badge>
                  <Button
                    variant="outline"
                    size="small"
                    className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <FiMoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message.message}
                    isOwn={message.isOwn}
                    senderInfo={message.isOwn ? userData : selectedContact}
                    timestamp={message.timestamp}
                  />
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="p-6 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full w-fit mx-auto mb-6 shadow-lg">
                    <FiMessageCircle className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Start Your Conversation
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    No messages yet. Begin secure healthcare communication!
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-t-2 border-teal-200">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="small"
                  className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <FiPaperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Type a secure message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="rounded-full border-2 border-teal-200 focus:border-teal-500 px-6 py-3"
                  />
                </div>
                <Button
                  variant="outline"
                  size="small"
                  className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <FiSmile className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  loading={sendingMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 px-6 py-3 rounded-full shadow-lg"
                >
                  <FiSend className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-center">
                <p className="text-xs text-teal-600 font-medium flex items-center gap-2">
                  <MdSecurity className="h-3 w-3" />
                  End-to-end encrypted healthcare communication
                </p>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center max-w-md">
              <div className="relative mb-8">
                <div className="p-8 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full w-fit mx-auto shadow-2xl">
                  <FiMessageCircle className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center shadow-lg">
                  <MdHealthAndSafety className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Healthcare Chat
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Select a conversation to start secure messaging with healthcare
                professionals. Your medical communications are encrypted and
                HIPAA-compliant.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => setNewChatModal(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <FiUserPlus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MdSecurity className="h-4 w-4 text-teal-600" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MdHealthAndSafety className="h-4 w-4 text-emerald-600" />
                    <span>HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MdVerifiedUser className="h-4 w-4 text-blue-600" />
                    <span>Verified Users</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={newChatModal}
        onClose={() => setNewChatModal(false)}
        contacts={allContacts}
        onStartChat={handleStartNewChat}
        userType={userType}
      />
    </div>
  );
};

export default HealthcareChat;
