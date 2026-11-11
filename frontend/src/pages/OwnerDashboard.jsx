import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Clock, 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Layers, 
  Zap,
  Phone,
  BarChart3,
  UserPlus,
  ChevronDown,
  Filter,
  Search,
  Lock,
  Unlock,
  ArrowRight,
  X,
  ShieldCheck,
  Award,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MapPicker from '../components/MapPicker';
import ReceiptModal from '../components/ReceiptModal';

export default function OwnerDashboard() {
  const { user, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'facilities', 'slots', 'bookings', 'reviews'

  // Data states
  const [facilities, setFacilities] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Presets and Helper Constants
  const PRESET_SPORTS = [
    { name: 'Badminton', price: 400, desc: 'BWF synthetic/wooden court' },
    { name: 'Box Cricket', price: 1200, desc: 'Floodlit box turf' },
    { name: 'Football Turf', price: 1000, desc: '5v5 / 7v7 turf ground' },
    { name: 'Tennis', price: 600, desc: 'Hard / Clay court' },
    { name: 'Pickleball', price: 350, desc: 'Regulation court' },
    { name: 'Swimming', price: 250, desc: 'Olympic pool' },
    { name: 'Basketball', price: 500, desc: 'Full court' },
    { name: 'Table Tennis', price: 200, desc: 'ITTF approved' }
  ];

  const AVAILABLE_AMENITIES = [
    { name: 'Parking', icon: '🅿️' },
    { name: 'Showers', icon: '🚿' },
    { name: 'Locker Room', icon: '🪪' },
    { name: 'Floodlights', icon: '💡' },
    { name: 'Drinking Water', icon: '💧' },
    { name: 'High-speed Wi-Fi', icon: '📶' },
    { name: 'Cafeteria / Refreshments', icon: '☕' },
    { name: 'Equipment Rental', icon: '🏸' },
    { name: 'First Aid Kit', icon: '🩺' },
    { name: 'Air Conditioning', icon: '❄️' },
    { name: 'Seating Gallery', icon: '🪑' },
    { name: 'EV Charging', icon: '⚡' }
  ];

  const getSportIcon = (sportName = '') => {
    const s = String(sportName).toLowerCase();
    if (s.includes('badminton')) return '🏸';
    if (s.includes('cricket')) return '🏏';
    if (s.includes('football') || s.includes('soccer')) return '⚽';
    if (s.includes('tennis')) return '🎾';
    if (s.includes('basket')) return '🏀';
    if (s.includes('volley')) return '🏐';
    if (s.includes('swim')) return '🏊';
    if (s.includes('table') || s.includes('tt') || s.includes('pickle')) return '🏓';
    if (s.includes('squash')) return '🎾';
    return '🏅';
  };

  // Facility Form Modal & Search
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [editingFacilityId, setEditingFacilityId] = useState(null);
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  
  // Custom inputs for the venue builder modal
  const [customSportInput, setCustomSportInput] = useState({ name: '', price: '', desc: '' });
  const [customCourtInput, setCustomCourtInput] = useState('');
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  const [facilityForm, setFacilityForm] = useState({
    name: '',
    description: '',
    phone: '',
    street: '',
    locality: '',
    city: 'Warangal',
    state: 'Telangana',
    pincode: '',
    latitude: '17.9689',
    longitude: '79.5941',
    sports: [
      { name: 'Badminton', price_per_hour: 400, description: 'BWF synthetic court' },
      { name: 'Box Cricket', price_per_hour: 1200, description: 'Floodlit box turf' }
    ],
    playing_areas: ['Badminton Court 1', 'Badminton Court 2', 'Cricket Pitch 1'],
    amenities: ['Parking', 'Showers', 'Locker Room', 'Floodlights', 'Drinking Water'],
    opening_time: '06:00',
    closing_time: '23:00',
    images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80']
  });

  // Slot Management Form
  const [selectedFacilityForSlot, setSelectedFacilityForSlot] = useState('');
  const [singleSlotForm, setSingleSlotForm] = useState({
    start_at: '',
    end_at: '',
    sport: '',
    playing_area: '',
    price: ''
  });

  // Bulk Slot Generator Form
  const [bulkForm, setBulkForm] = useState({
    facility_id: '',
    start_date: new Date().toISOString().split('T')[0],
    days: 7,
    start_hour: 6,
    end_hour: 22,
    sport: '',
    playing_area: '',
    price: ''
  });

  // Slot Table Filter States
  const [slotStatusFilter, setSlotStatusFilter] = useState('all');
  const [slotSearchQuery, setSlotSearchQuery] = useState('');

  // Selected date for slot management (defaults to today)
  const [selectedSlotDate, setSelectedSlotDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Custom Slot Creator Modal
  const [singleSlotModalOpen, setSingleSlotModalOpen] = useState(false);
  const [customSlotData, setCustomSlotData] = useState({
    sport: '',
    playing_area: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '11:00',
    price: 400
  });

  // Offline Booking Modal
  const [offlineModalSlot, setOfflineModalSlot] = useState(null);
  const [offlineForm, setOfflineForm] = useState({
    customer_name: '',
    customer_phone: '',
    amount: '',
    payment_method: 'Cash'
  });

  // Receipt Modal
  const [viewReceiptId, setViewReceiptId] = useState(null);

  // Add Court Modal State
  const [addCourtModalOpen, setAddCourtModalOpen] = useState(false);
  const [addCourtData, setAddCourtData] = useState({
    sport: '',
    courtName: '',
    autoGenerate: true,
    startHour: 6,
    endHour: 22
  });

  // Delete Court Confirmation Modal State
  const [deleteCourtModalOpen, setDeleteCourtModalOpen] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState({
    sport: '',
    courtName: '',
    slotsCount: 0,
    bookedCount: 0
  });

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      const [facRes, slotRes, bookRes, revRes] = await Promise.all([
        api('/owner/facilities'),
        api('/owner/slots'),
        api('/owner/bookings'),
        api('/owner/reviews')
      ]);

      setFacilities(facRes.facilities || []);
      setSlots(slotRes.slots || []);
      setBookings(bookRes.bookings || []);
      setReviews(revRes.reviews || []);

      if (facRes.facilities && facRes.facilities.length > 0 && !selectedFacilityForSlot) {
        setSelectedFacilityForSlot(facRes.facilities[0]._id);
        setBulkForm(b => ({ ...b, facility_id: facRes.facilities[0]._id }));
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  // 1. Facility CRUD Handlers
  const openAddFacility = () => {
    setEditingFacilityId(null);
    setFacilityForm({
      name: '',
      description: '',
      phone: user?.phone || '',
      street: '',
      locality: '',
      city: 'Warangal',
      state: 'Telangana',
      pincode: '',
      latitude: '17.9689',
      longitude: '79.5941',
      sports: [
        { name: 'Badminton', price_per_hour: 400, description: 'BWF synthetic court' },
        { name: 'Box Cricket', price_per_hour: 1200, description: 'Floodlit box turf' }
      ],
      playing_areas: ['Court 1', 'Court 2', 'Turf Pitch 1'],
      amenities: ['Parking', 'Showers', 'Locker Room', 'Floodlights', 'Drinking Water'],
      opening_time: '06:00',
      closing_time: '23:00',
      images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80']
    });
    setCustomSportInput({ name: '', price: '', desc: '' });
    setCustomCourtInput('');
    setCustomPhotoInput('');
    setFacilityModalOpen(true);
  };

  const openEditFacility = (f) => {
    setEditingFacilityId(f._id);
    const coords = f.location?.coordinates || [79.5941, 17.9689];

    setFacilityForm({
      name: f.name || '',
      description: f.description || '',
      phone: f.phone || '',
      street: f.address?.street || '',
      locality: f.address?.locality || '',
      city: f.address?.city || '',
      state: f.address?.state || 'Telangana',
      pincode: f.address?.pincode || '',
      latitude: String(coords[1]),
      longitude: String(coords[0]),
      sports: f.sports && f.sports.length > 0 
        ? f.sports.map(s => ({
            name: s.name,
            price_per_hour: Number(s.price_per_hour || 0),
            description: s.description || ''
          })) 
        : [{ name: 'Badminton', price_per_hour: 400, description: 'BWF synthetic court' }],
      playing_areas: f.playing_areas && f.playing_areas.length > 0 
        ? [...f.playing_areas] 
        : ['Court 1', 'Court 2'],
      amenities: f.amenities && f.amenities.length > 0 
        ? [...f.amenities] 
        : ['Parking', 'Showers', 'Floodlights'],
      opening_time: f.opening_time || '06:00',
      closing_time: f.closing_time || '23:00',
      images: f.images && f.images.length > 0 
        ? [...f.images] 
        : ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80']
    });
    setCustomSportInput({ name: '', price: '', desc: '' });
    setCustomCourtInput('');
    setCustomPhotoInput('');
    setFacilityModalOpen(true);
  };

  // Facility Builder Helpers
  const handleAddPresetSport = (preset) => {
    if (facilityForm.sports.some(s => s.name.toLowerCase() === preset.name.toLowerCase())) {
      showToast(`${preset.name} is already added to this venue!`, 'info');
      return;
    }
    setFacilityForm(prev => ({
      ...prev,
      sports: [...prev.sports, { name: preset.name, price_per_hour: preset.price, description: preset.desc }]
    }));
  };

  const handleAddCustomSport = (e) => {
    e?.preventDefault();
    if (!customSportInput.name.trim()) {
      showToast('Please enter a sport name', 'error');
      return;
    }
    const priceNum = Number(customSportInput.price) || 400;
    setFacilityForm(prev => ({
      ...prev,
      sports: [...prev.sports, {
        name: customSportInput.name.trim(),
        price_per_hour: priceNum,
        description: customSportInput.desc.trim()
      }]
    }));
    setCustomSportInput({ name: '', price: '', desc: '' });
  };

  const handleRemoveSport = (idxToRemove) => {
    if (facilityForm.sports.length <= 1) {
      showToast('Facility must offer at least one sport.', 'error');
      return;
    }
    setFacilityForm(prev => ({
      ...prev,
      sports: prev.sports.filter((_, idx) => idx !== idxToRemove)
    }));
  };

  const handleUpdateSportPrice = (idx, newPrice) => {
    setFacilityForm(prev => ({
      ...prev,
      sports: prev.sports.map((s, i) => i === idx ? { ...s, price_per_hour: Number(newPrice) || 0 } : s)
    }));
  };

  const handleAddCourt = (courtName) => {
    const val = (courtName || customCourtInput).trim();
    if (!val) return;
    if (facilityForm.playing_areas.includes(val)) {
      showToast(`Playing area "${val}" already exists.`, 'info');
      return;
    }
    setFacilityForm(prev => ({
      ...prev,
      playing_areas: [...prev.playing_areas, val]
    }));
    setCustomCourtInput('');
  };

  const handleRemoveCourt = (courtToRemove) => {
    if (facilityForm.playing_areas.length <= 1) {
      showToast('Facility must have at least one playing court / area.', 'error');
      return;
    }
    setFacilityForm(prev => ({
      ...prev,
      playing_areas: prev.playing_areas.filter(c => c !== courtToRemove)
    }));
  };

  const handleToggleAmenity = (amenity) => {
    setFacilityForm(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const handleAddPhoto = () => {
    if (!customPhotoInput.trim()) return;
    setFacilityForm(prev => ({
      ...prev,
      images: [...prev.images, customPhotoInput.trim()]
    }));
    setCustomPhotoInput('');
  };

  const handleRemovePhoto = (idxToRemove) => {
    setFacilityForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== idxToRemove)
    }));
  };

  const handleSaveFacility = async (e) => {
    e.preventDefault();
    try {
      if (!facilityForm.name?.trim()) {
        showToast('Please provide a facility name.', 'error');
        return;
      }
      if (!facilityForm.locality?.trim() || !facilityForm.city?.trim()) {
        showToast('Please enter both locality and city.', 'error');
        return;
      }
      if (!facilityForm.sports || facilityForm.sports.length === 0) {
        showToast('Please add at least one sport with hourly pricing.', 'error');
        return;
      }

      const payload = {
        name: facilityForm.name.trim(),
        description: facilityForm.description.trim(),
        phone: facilityForm.phone.trim(),
        address: {
          street: facilityForm.street.trim(),
          locality: facilityForm.locality.trim(),
          city: facilityForm.city.trim(),
          state: facilityForm.state.trim(),
          pincode: facilityForm.pincode.trim()
        },
        latitude: facilityForm.latitude,
        longitude: facilityForm.longitude,
        sports: facilityForm.sports,
        playing_areas: facilityForm.playing_areas.filter(Boolean),
        amenities: facilityForm.amenities.filter(Boolean),
        images: facilityForm.images.filter(Boolean),
        opening_time: facilityForm.opening_time,
        closing_time: facilityForm.closing_time
      };

      if (editingFacilityId) {
        await api(`/facilities/${editingFacilityId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Facility updated successfully!', 'success');
      } else {
        await api('/facilities', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('New facility submitted for approval!', 'success');
      }

      setFacilityModalOpen(false);
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteFacility = async (fid) => {
    if (!window.confirm('Are you sure you want to delete this facility? Active slots will be deactivated.')) {
      return;
    }
    try {
      await api(`/facilities/${fid}`, { method: 'DELETE' });
      showToast('Facility removed.', 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 2. Slot Creation Handlers
  const handleCreateSingleSlot = async (e) => {
    e.preventDefault();
    try {
      await api('/owner/slots', {
        method: 'POST',
        body: JSON.stringify({
          facility_id: selectedFacilityForSlot,
          start_at: new Date(singleSlotForm.start_at).toISOString(),
          end_at: new Date(singleSlotForm.end_at).toISOString(),
          sport: singleSlotForm.sport || undefined,
          playing_area: singleSlotForm.playing_area || undefined,
          price: singleSlotForm.price ? Number(singleSlotForm.price) : undefined
        })
      });
      showToast('Time slot published!', 'success');
      loadOwnerData();
      setSingleSlotForm({ start_at: '', end_at: '', sport: '', playing_area: '', price: '' });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleBulkGenerateSlots = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/owner/slots/bulk', {
        method: 'POST',
        body: JSON.stringify({
          facility_id: bulkForm.facility_id || selectedFacilityForSlot,
          start_date: bulkForm.start_date,
          days: Number(bulkForm.days),
          start_hour: Number(bulkForm.start_hour),
          end_hour: Number(bulkForm.end_hour),
          sport: bulkForm.sport || undefined,
          playing_area: bulkForm.playing_area || undefined,
          price: bulkForm.price ? Number(bulkForm.price) : undefined
        })
      });
      showToast(res.message || 'Slots generated successfully!', 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleBlock = async (sid) => {
    try {
      const res = await api(`/owner/slots/${sid}/block`, { method: 'PATCH' });
      showToast(res.message, 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Helper to map courts to sports
  const getCourtsForSport = (sportName, facility, allSlots) => {
    if (!facility) return [];
    const sportLower = (sportName || '').toLowerCase();
    
    // Direct matches in facility.playing_areas
    const matched = (facility.playing_areas || []).filter(area => 
      area.toLowerCase().includes(sportLower)
    );

    // Also include courts linked via existing slots
    const slotAreas = Array.from(new Set(
      (allSlots || [])
        .filter(s => s.facility_id === facility._id && (s.sport || '').toLowerCase() === sportLower && s.playing_area)
        .map(s => s.playing_area)
    ));
    slotAreas.forEach(a => {
      if (!matched.includes(a)) matched.push(a);
    });

    if (matched.length > 0) return matched;

    // If single sport facility, assign all areas
    if (facility.sports && facility.sports.length === 1) {
      return facility.playing_areas && facility.playing_areas.length > 0
        ? facility.playing_areas
        : [`${sportName} Court 1`];
    }

    // If multiple sports, assign unclaimed areas
    const otherSports = (facility.sports || []).filter(s => s.name.toLowerCase() !== sportLower);
    const unclaimed = (facility.playing_areas || []).filter(area => {
      return !otherSports.some(os => area.toLowerCase().includes(os.name.toLowerCase()));
    });
    if (unclaimed.length > 0) return unclaimed;

    return [`${sportName} Court 1`];
  };

  const getSlotDateString = (isoStr) => {
    try {
      const d = new Date(isoStr);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const handleDeleteSlot = async (slotId, slotInfo) => {
    if (!window.confirm(`Delete this slot (${slotInfo})?`)) return;
    try {
      const res = await api(`/owner/slots/${slotId}`, { method: 'DELETE' });
      showToast(res.message || 'Slot deleted successfully!', 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleApplyPreset = async ({ sport, playing_area, playing_areas, start_hour, end_hour, targetDate }) => {
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    if (!facilityObj) return;
    const sportObj = facilityObj.sports?.find(s => s.name === sport);
    const price = sportObj ? sportObj.price_per_hour : 400;

    try {
      const payload = {
        facility_id: facilityObj._id,
        start_date: targetDate || selectedSlotDate,
        days: 1, // Just this date (e.g. today)
        start_hour: Number(start_hour),
        end_hour: Number(end_hour),
        sport: sport,
        price: price
      };
      if (playing_area) payload.playing_area = playing_area;
      else if (playing_areas) payload.playing_areas = playing_areas;

      const res = await api('/owner/slots/bulk', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast(res.message || 'Slots generated successfully!', 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleFillEntireFacilityForToday = async () => {
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    if (!facilityObj) return;
    const sportsList = facilityObj.sports || [];
    if (sportsList.length === 0) {
      showToast('Please add at least one sport to this facility first.', 'warning');
      return;
    }

    try {
      for (const sp of sportsList) {
        const courts = getCourtsForSport(sp.name, facilityObj, slots);
        await api('/owner/slots/bulk', {
          method: 'POST',
          body: JSON.stringify({
            facility_id: facilityObj._id,
            start_date: selectedSlotDate,
            days: 1,
            start_hour: 6,
            end_hour: 22,
            sport: sp.name,
            playing_areas: courts,
            price: sp.price_per_hour || 400
          })
        });
      }
      showToast(`Generated full day slots for all courts and sports for ${selectedSlotDate}!`, 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openAddCourtModal = (sportName) => {
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    const existingCourts = facilityObj?.playing_areas || [];
    
    // Auto-suggest next court number for this sport
    let nextNum = 1;
    while (existingCourts.some(c => c.toLowerCase() === `${sportName.toLowerCase()} court ${nextNum}` || c.toLowerCase() === `court ${nextNum}`)) {
      nextNum++;
    }

    setAddCourtData({
      sport: sportName,
      courtName: `${sportName} Court ${nextNum}`,
      autoGenerate: true,
      startHour: 6,
      endHour: 22
    });
    setAddCourtModalOpen(true);
  };

  const handleConfirmAddCourt = async (e) => {
    e.preventDefault();
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    if (!facilityObj) return;

    const trimmedName = addCourtData.courtName.trim();
    if (!trimmedName) {
      showToast('Please enter a court name.', 'error');
      return;
    }

    try {
      const res = await api('/owner/courts', {
        method: 'POST',
        body: JSON.stringify({
          facility_id: facilityObj._id,
          court_name: trimmedName,
          sport: addCourtData.sport,
          auto_generate: addCourtData.autoGenerate,
          date: selectedSlotDate,
          start_hour: Number(addCourtData.startHour || 6),
          end_hour: Number(addCourtData.endHour || 22)
        })
      });

      showToast(res.message || `Court "${trimmedName}" added successfully!`, 'success');
      setAddCourtModalOpen(false);
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openDeleteCourtModal = (sportName, courtName) => {
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    const facilityFid = facilityObj?._id;

    const courtAllSlots = slots.filter(s => s.facility_id === facilityFid && s.playing_area === courtName);
    const bookedCount = courtAllSlots.filter(s => s.status === 'booked').length;

    setCourtToDelete({
      sport: sportName,
      courtName: courtName,
      slotsCount: courtAllSlots.length,
      bookedCount: bookedCount
    });
    setDeleteCourtModalOpen(true);
  };

  const handleConfirmDeleteCourt = async () => {
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    if (!facilityObj || !courtToDelete.courtName) return;

    if (courtToDelete.bookedCount > 0) {
      showToast(`Cannot delete court with ${courtToDelete.bookedCount} active booking(s). Please cancel or complete them first.`, 'error');
      return;
    }

    try {
      const res = await api(`/owner/courts?facility_id=${facilityObj._id}&court_name=${encodeURIComponent(courtToDelete.courtName)}`, {
        method: 'DELETE'
      });

      showToast(res.message || `Court "${courtToDelete.courtName}" deleted successfully!`, 'success');
      setDeleteCourtModalOpen(false);
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openCreateSlotModal = (sport, court) => {
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    const sportObj = facilityObj?.sports?.find(s => s.name === sport);
    setCustomSlotData({
      sport: sport,
      playing_area: court,
      date: selectedSlotDate,
      start_time: '10:00',
      end_time: '11:00',
      price: sportObj ? sportObj.price_per_hour : 400
    });
    setSingleSlotModalOpen(true);
  };

  const handlePublishCustomSlot = async (e) => {
    e.preventDefault();
    const facilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
    if (!facilityObj) return;

    try {
      const startIso = new Date(`${customSlotData.date}T${customSlotData.start_time}:00`).toISOString();
      const endIso = new Date(`${customSlotData.date}T${customSlotData.end_time}:00`).toISOString();

      await api('/owner/slots', {
        method: 'POST',
        body: JSON.stringify({
          facility_id: facilityObj._id,
          sport: customSlotData.sport,
          playing_area: customSlotData.playing_area,
          start_at: startIso,
          end_at: endIso,
          price: Number(customSlotData.price || 400)
        })
      });
      showToast(`Slot created for ${customSlotData.playing_area} at ${customSlotData.start_time}!`, 'success');
      setSingleSlotModalOpen(false);
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 3. Offline Booking Handlers
  const openOfflineModal = (slot) => {
    setOfflineModalSlot(slot);
    setOfflineForm({
      customer_name: 'Walk-in Customer',
      customer_phone: '',
      amount: String(slot.price || 400),
      payment_method: 'Cash'
    });
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();
    if (!offlineModalSlot) return;

    try {
      await api('/owner/offline-bookings', {
        method: 'POST',
        body: JSON.stringify({
          slot_id: offlineModalSlot._id,
          customer_name: offlineForm.customer_name.trim(),
          customer_phone: offlineForm.customer_phone.trim(),
          amount: Number(offlineForm.amount),
          payment_method: offlineForm.payment_method
        })
      });
      showToast('Walk-in booking recorded successfully!', 'success');
      setOfflineModalSlot(null);
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCompleteBooking = async (bid) => {
    try {
      const res = await api(`/owner/bookings/${bid}/complete`, { method: 'PATCH' });
      showToast(res.message || 'Booking marked completed!', 'success');
      loadOwnerData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Metrics
  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const availableSlotsCount = slots.filter(s => s.status === 'available').length;
  const bookedSlotsCount = slots.filter(s => s.status === 'booked').length;
  const occupancyRate = slots.length > 0 ? Math.round((bookedSlotsCount / slots.length) * 100) : 0;

  return (
    <div className="dashboard-page owner-dashboard">
      <div className="dashboard-hero-banner owner-banner">
        <div className="dash-hero-content">
          <span className="section-kicker">VENUE MANAGEMENT CONSOLE</span>
          <h1>Facility Owner Workspace</h1>
          <p>
            Manage multiple sports facilities, publish live time slots, log offline walk-ins, and track daily revenue.
          </p>
        </div>
        <div className="dash-hero-actions">
          <button className="btn-white-solid" onClick={openAddFacility}>
            <Plus size={16} /> Add New Facility
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-nav-bar">
        <button 
          className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> Analytics & Metrics
        </button>
        <button 
          className={`dash-tab ${activeTab === 'facilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('facilities')}
        >
          <Building2 size={16} /> My Venues ({facilities.length})
        </button>
        <button 
          className={`dash-tab ${activeTab === 'slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('slots')}
        >
          <Clock size={16} /> Slot & Availability Manager
        </button>
        <button 
          className={`dash-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <Users size={16} /> Bookings ({bookings.length})
        </button>
        <button 
          className={`dash-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <Star size={16} /> Reviews ({reviews.length})
        </button>
      </div>

      <div className="dash-body-content">
        {/* 1. Analytics Overview */}
        {activeTab === 'overview' && (
          <div className="analytics-section">
            <div className="kpi-cards-grid">
              <div className="kpi-card green-kpi">
                <div className="kpi-icon"><DollarSign size={24} /></div>
                <div>
                  <label>Total Venue Revenue</label>
                  <b>₹{totalRevenue.toLocaleString('en-IN')}</b>
                  <small>From confirmed online & walk-ins</small>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon"><Users size={24} /></div>
                <div>
                  <label>Total Bookings Logged</label>
                  <b>{bookings.length}</b>
                  <small>{bookings.filter(b => b.type === 'offline').length} offline walk-ins</small>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon"><Zap size={24} /></div>
                <div>
                  <label>Court Occupancy</label>
                  <b>{occupancyRate}%</b>
                  <small>{bookedSlotsCount} of {slots.length} total slots booked</small>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon"><Star size={24} /></div>
                <div>
                  <label>Customer Reviews</label>
                  <b>{reviews.length}</b>
                  <small>Verified post-game feedback</small>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="owner-quick-actions-panel">
              <div className="action-box" onClick={() => setActiveTab('facilities')}>
                <Building2 size={24} />
                <b>Manage Venues</b>
                <p>Edit addresses, coordinates, sports, and pricing.</p>
              </div>

              <div className="action-box" onClick={() => setActiveTab('slots')}>
                <Clock size={24} />
                <b>Generate Time Slots</b>
                <p>Run bulk scheduler for the next 7 to 30 days.</p>
              </div>

              <div className="action-box" onClick={() => setActiveTab('bookings')}>
                <UserPlus size={24} />
                <b>Record Walk-in</b>
                <p>Reserve available slots for phone or on-site customers.</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Facilities Tab */}
        {activeTab === 'facilities' && (() => {
          const filteredFacilities = facilities.filter(f => {
            if (!venueSearchQuery.trim()) return true;
            const q = venueSearchQuery.toLowerCase();
            return (
              f.name?.toLowerCase().includes(q) ||
              f.address?.locality?.toLowerCase().includes(q) ||
              f.address?.city?.toLowerCase().includes(q) ||
              f.sports?.some(s => s.name?.toLowerCase().includes(q)) ||
              f.playing_areas?.some(a => a.toLowerCase().includes(q))
            );
          });

          const totalCourtsCount = facilities.reduce((sum, f) => sum + (f.playing_areas?.length || 0), 0);
          const approvedCount = facilities.filter(f => f.status === 'approved').length;

          return (
            <div className="facilities-management-section">
              {/* Modern Registered Venues Header */}
              <div className="venues-management-header">
                <div className="header-text-block">
                  <div className="title-with-badge">
                    <h3>My Registered Venues</h3>
                    <span className="venues-count-pill">{facilities.length} Venues</span>
                  </div>
                  <p>Configure venue operating hours, dynamic sports pricing, playing courts, and photo galleries.</p>
                </div>

                <div className="header-actions-block">
                  <button className="btn-solid add-venue-main-btn" onClick={openAddFacility}>
                    <Plus size={16} /> Register New Venue
                  </button>
                </div>
              </div>

              {/* Venues Stats & Search Filter Bar */}
              <div className="venues-search-stats-bar">
                <div className="venues-search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search venues by name, locality, city, sport or court..."
                    value={venueSearchQuery}
                    onChange={e => setVenueSearchQuery(e.target.value)}
                    className="venues-search-input"
                  />
                  {venueSearchQuery && (
                    <button 
                      type="button" 
                      className="clear-search-btn" 
                      onClick={() => setVenueSearchQuery('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="venues-quick-stats">
                  <span className="stat-capsule green">
                    <CheckCircle size={13} /> {approvedCount} Active / Live
                  </span>
                  <span className="stat-capsule neutral">
                    <Layers size={13} /> {totalCourtsCount} Courts Configured
                  </span>
                </div>
              </div>

              {/* Venues Cards Grid */}
              <div className="owner-facilities-grid-modern">
                {filteredFacilities.map(f => {
                  const bannerImg = f.images && f.images.length > 0 
                    ? f.images[0] 
                    : 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80';
                  const [latCoord, lngCoord] = f.location?.coordinates 
                    ? [f.location.coordinates[1], f.location.coordinates[0]] 
                    : [17.9689, 79.5941];

                  return (
                    <div key={f._id} className="owner-venue-card-premium">
                      {/* Visual Thumbnail Banner */}
                      <div className="venue-card-banner">
                        <img src={bannerImg} alt={f.name} className="venue-banner-img" />
                        <div className="venue-banner-gradient"></div>
                        
                        <div className="banner-top-badges">
                          <span className={`status-pill ${f.status || 'approved'}`}>
                            {f.status === 'approved' ? '✓ ACTIVE & APPROVED' : '⏳ PENDING APPROVAL'}
                          </span>
                          <span className="rating-pill">
                            <Star size={13} className="star-icon" /> {f.avg_rating ? f.avg_rating.toFixed(1) : 'New'} ({f.review_count || 0})
                          </span>
                        </div>

                        <div className="banner-bottom-info">
                          <h4 className="banner-venue-name">{f.name}</h4>
                          <p className="banner-venue-location">
                            <MapPin size={13} /> {f.address?.locality}, {f.address?.city}
                          </p>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="venue-card-body">
                        {/* Meta Pills Bar */}
                        <div className="venue-meta-pills">
                          <span className="meta-pill">
                            <Clock size={12} /> {f.opening_time || '06:00'} – {f.closing_time || '23:00'}
                          </span>
                          {f.phone && (
                            <span className="meta-pill">
                              <Phone size={12} /> {f.phone}
                            </span>
                          )}
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${latCoord},${lngCoord}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="meta-pill map-link"
                            title="Open in Google Maps"
                          >
                            <ExternalLink size={12} /> Directions
                          </a>
                        </div>

                        {/* Description */}
                        {f.description && (
                          <p className="venue-card-description">{f.description}</p>
                        )}

                        {/* Sports & Hourly Rates */}
                        <div className="venue-spec-section">
                          <label className="spec-heading">
                            <Award size={12} /> AVAILABLE SPORTS & RATES
                          </label>
                          <div className="spec-chips-wrap">
                            {f.sports?.map((s, idx) => (
                              <span key={idx} className="spec-sport-chip">
                                <span className="sport-chip-emoji">{getSportIcon(s.name)}</span>
                                <b className="sport-chip-title">{s.name}</b>
                                <span className="sport-chip-price">₹{s.price_per_hour}/hr</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Courts / Playing Areas */}
                        <div className="venue-spec-section">
                          <label className="spec-heading">
                            <Layers size={12} /> COURTS / PLAYING AREAS ({f.playing_areas?.length || 0})
                          </label>
                          <div className="spec-chips-wrap">
                            {f.playing_areas?.map((area, idx) => (
                              <span key={idx} className="spec-court-chip">
                                🏟️ {area}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Amenities */}
                        {f.amenities && f.amenities.length > 0 && (
                          <div className="venue-spec-section">
                            <label className="spec-heading">
                              <ShieldCheck size={12} /> AMENITIES ({f.amenities.length})
                            </label>
                            <div className="spec-amenities-wrap">
                              {f.amenities.map((am, idx) => (
                                <span key={idx} className="spec-amenity-chip">
                                  ✓ {am}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Footer */}
                        <div className="venue-card-actions-footer">
                          <button 
                            type="button"
                            className="btn-venue-action-primary"
                            onClick={() => {
                              setSelectedFacilityForSlot(f._id);
                              setActiveTab('slots');
                            }}
                            title="Open Slot & Availability Manager for this venue"
                          >
                            <Zap size={14} /> Manage Slots & Schedule →
                          </button>

                          <div className="venue-card-sub-actions">
                            <button 
                              type="button" 
                              className="btn-venue-action-edit" 
                              onClick={() => openEditFacility(f)}
                              title="Edit venue information, sports, courts, and pricing"
                            >
                              <Edit3 size={14} /> Edit Venue
                            </button>
                            <button 
                              type="button" 
                              className="btn-venue-action-delete" 
                              onClick={() => handleDeleteFacility(f._id)}
                              title="Delete this facility"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredFacilities.length === 0 && facilities.length > 0 && (
                  <div className="empty-search-state">
                    <Search size={32} />
                    <h4>No venues match "{venueSearchQuery}"</h4>
                    <p>Try searching with another keyword or clear the search filter.</p>
                    <button className="btn-outline" onClick={() => setVenueSearchQuery('')}>
                      Clear Search
                    </button>
                  </div>
                )}

                {facilities.length === 0 && (
                  <div className="empty-state-card">
                    <div className="empty-icon-circle">
                      <Building2 size={32} />
                    </div>
                    <h4>No Venues Registered Yet</h4>
                    <p>Register your first sports arena or court facility to start publishing slots and accepting player bookings.</p>
                    <button className="btn-solid" onClick={openAddFacility}>
                      <Plus size={16} /> Register First Venue
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 3. Slots Tab */}
        {activeTab === 'slots' && (() => {
          const selectedFacilityObj = facilities.find(f => f._id === selectedFacilityForSlot) || facilities[0];
          const currentFid = selectedFacilityObj?._id || selectedFacilityForSlot;
          const facilitySlots = slots.filter(s => s.facility_id === currentFid);
          const facilitySports = selectedFacilityObj?.sports || [];

          // Slots on the selected date
          const todayDateStr = new Date().toISOString().split('T')[0];
          const dateSlots = facilitySlots.filter(s => getSlotDateString(s.start_at) === selectedSlotDate);

          const quickDates = [0, 1, 2, 3, 4, 5].map(offset => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const dateStr = d.toISOString().split('T')[0];
            const isToday = offset === 0;
            const isTomorrow = offset === 1;
            const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return { dateStr, dayName, monthDay, isToday };
          });

          return (
            <div className="slots-management-section">
              {/* Facility & Date Control Banner */}
              <div className="facility-picker-bar">
                <div className="facility-selector-info">
                  <div className="facility-avatar-icon">
                    <Building2 size={24} />
                  </div>
                  <div className="facility-picker-details">
                    <span className="picker-eyebrow">ACTIVE SPORTS FACILITY</span>
                    <div className="custom-select-wrapper">
                      <select 
                        value={selectedFacilityForSlot} 
                        onChange={e => {
                          setSelectedFacilityForSlot(e.target.value);
                          setBulkForm(b => ({ ...b, facility_id: e.target.value }));
                        }}
                        className="facility-dropdown-select"
                      >
                        {facilities.map(f => (
                          <option key={f._id} value={f._id}>
                            {f.name} — {f.address?.locality || f.address?.city || 'Main'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="dropdown-caret" />
                    </div>
                  </div>
                </div>

                <div className="facility-quick-stats">
                  <div className="quick-stat-badge">
                    <Clock size={14} />
                    <span><b>{dateSlots.length}</b> Slots on {selectedSlotDate === todayDateStr ? 'Today' : selectedSlotDate}</span>
                  </div>
                  <div className="quick-stat-badge">
                    <Layers size={14} />
                    <span><b>{facilitySports.length}</b> Sports Active</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn-fill-today"
                    onClick={handleFillEntireFacilityForToday}
                    title="Generate 1-hour slots across all courts for this entire day"
                  >
                    <Zap size={15} /> ⚡ 1-Click Fill {selectedSlotDate === todayDateStr ? 'Today' : 'Day'} Schedule
                  </button>
                </div>
              </div>

              {/* Date Navigation Bar */}
              <div className="owner-date-strip-card">
                <div className="date-strip-left">
                  <span className="date-strip-label"><Calendar size={16} /> Schedule Date:</span>
                  <div className="owner-date-pills">
                    {quickDates.map(q => {
                      const isSelected = selectedSlotDate === q.dateStr;
                      return (
                        <button
                          key={q.dateStr}
                          type="button"
                          className={`owner-date-chip ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedSlotDate(q.dateStr)}
                        >
                          <span className="chip-day-name">{q.dayName}</span>
                          <span className="chip-date-num">{q.monthDay}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="date-strip-right">
                  <label className="custom-date-label">Custom Date:</label>
                  <input 
                    type="date"
                    value={selectedSlotDate}
                    onChange={e => setSelectedSlotDate(e.target.value)}
                    className="modern-date-input-picker"
                  />
                </div>
              </div>

              {/* Sport-by-Sport and Court-by-Court Hierarchy */}
              {facilitySports.length > 0 ? (
                <div className="sports-tree-container">
                  {facilitySports.map(sp => {
                    const courts = getCourtsForSport(sp.name, selectedFacilityObj, facilitySlots);
                    const sportSlots = dateSlots.filter(s => (s.sport || '').toLowerCase() === sp.name.toLowerCase());

                    return (
                      <div key={sp.name} className="sport-section-card">
                        {/* Sport Section Header */}
                        <div className="sport-section-header">
                          <div className="sport-title-left">
                            <div className="sport-icon-circle">
                              <Zap size={20} />
                            </div>
                            <div>
                              <div className="sport-title-row">
                                <h3>{sp.name}</h3>
                                <span className="sport-price-badge">₹{sp.price_per_hour}/hr</span>
                                <span className="sport-courts-counter">{courts.length} {courts.length === 1 ? 'Court' : 'Courts'}</span>
                              </div>
                              <p className="sport-desc-sub">{sp.description || 'Professional grade courts and equipment'}</p>
                            </div>
                          </div>

                          {/* Presets for this entire sport */}
                          <div className="sport-presets-wrapper">
                            <span className="preset-bar-title">⚡ 1-Click Preset (All {courts.length} Courts):</span>
                            <div className="preset-buttons-group">
                              <button 
                                type="button" 
                                className="btn-preset-pill full"
                                onClick={() => handleApplyPreset({ sport: sp.name, playing_areas: courts, start_hour: 6, end_hour: 22 })}
                                title="Generate 6:00 AM to 10:00 PM slots for all courts of this sport"
                              >
                                Full Day (6 AM – 10 PM)
                              </button>
                              <button 
                                type="button" 
                                className="btn-preset-pill morning"
                                onClick={() => handleApplyPreset({ sport: sp.name, playing_areas: courts, start_hour: 6, end_hour: 12 })}
                                title="Generate 6:00 AM to 12:00 PM morning slots"
                              >
                                Morning (6 AM – 12 PM)
                              </button>
                              <button 
                                type="button" 
                                className="btn-preset-pill evening"
                                onClick={() => handleApplyPreset({ sport: sp.name, playing_areas: courts, start_hour: 16, end_hour: 22 })}
                                title="Generate 4:00 PM to 10:00 PM evening peak slots"
                              >
                                Evening (4 PM – 10 PM)
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Courts Grid for this Sport */}
                        <div className="courts-cards-grid">
                          {courts.map(courtName => {
                            const courtSlots = sportSlots.filter(s => s.playing_area === courtName);

                            return (
                              <div key={courtName} className="court-column-box">
                                {/* Court Header */}
                                <div className="court-header-bar">
                                  <div className="court-name-block">
                                    <div className="court-badge-icon">
                                      <Layers size={16} />
                                    </div>
                                    <div>
                                      <h5>{courtName}</h5>
                                      <span className="court-slots-count">
                                        <b>{courtSlots.length}</b> slots on {selectedSlotDate === todayDateStr ? 'Today' : selectedSlotDate}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="court-actions-right">
                                    <button 
                                      type="button" 
                                      className="btn-add-custom-slot"
                                      onClick={() => openCreateSlotModal(sp.name, courtName)}
                                      title="Add a custom time slot at a particular time for this court"
                                    >
                                      <Plus size={13} /> Custom Slot
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn-delete-court-header"
                                      onClick={() => openDeleteCourtModal(sp.name, courtName)}
                                      title={`Delete ${courtName} from this facility`}
                                    >
                                      <Trash2 size={13} /> Delete Court
                                    </button>
                                  </div>
                                </div>

                                {/* Court Quick Presets Bar */}
                                <div className="court-quick-presets-bar">
                                  <span className="court-presets-label">⚡ Presets:</span>
                                  <button 
                                    type="button" 
                                    className="court-preset-btn"
                                    onClick={() => handleApplyPreset({ sport: sp.name, playing_area: courtName, start_hour: 6, end_hour: 22 })}
                                  >
                                    Full Day (6-22)
                                  </button>
                                  <button 
                                    type="button" 
                                    className="court-preset-btn"
                                    onClick={() => handleApplyPreset({ sport: sp.name, playing_area: courtName, start_hour: 6, end_hour: 12 })}
                                  >
                                    Morning (6-12)
                                  </button>
                                  <button 
                                    type="button" 
                                    className="court-preset-btn"
                                    onClick={() => handleApplyPreset({ sport: sp.name, playing_area: courtName, start_hour: 16, end_hour: 22 })}
                                  >
                                    Evening (16-22)
                                  </button>
                                </div>

                                {/* Court Slots Timeline List */}
                                {courtSlots.length > 0 ? (
                                  <div className="court-slots-list">
                                    {courtSlots.map(s => {
                                      const timeStr = `${new Date(s.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(s.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                      return (
                                        <div key={s._id} className={`court-slot-item ${s.status}`}>
                                          <div className="slot-left-meta">
                                            <div className="slot-item-time">
                                              <Clock size={13} className="slot-time-icon" />
                                              <span>{timeStr}</span>
                                            </div>
                                            <div className="slot-sub-info">
                                              <span className="slot-item-price">₹{s.price}</span>
                                              {s.status === 'available' && (
                                                <span className="status-live-chip available"><span className="dot"></span> Open</span>
                                              )}
                                              {s.status === 'booked' && (
                                                <span className="status-live-chip booked"><span className="dot"></span> Booked</span>
                                              )}
                                              {s.status === 'blocked' && (
                                                <span className="status-live-chip blocked"><span className="dot"></span> Blocked</span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="slot-right-actions">
                                            {s.status === 'available' && (
                                              <>
                                                <button 
                                                  className="btn-slot-walkin"
                                                  onClick={() => openOfflineModal(s)}
                                                  title="Book offline walk-in customer"
                                                >
                                                  <Users size={12} /> Walk-in
                                                </button>
                                                <button 
                                                  className="btn-slot-block"
                                                  onClick={() => handleToggleBlock(s._id)}
                                                  title="Mark unavailable for court maintenance"
                                                >
                                                  <Lock size={12} /> Block
                                                </button>
                                              </>
                                            )}
                                            {s.status === 'blocked' && (
                                              <button 
                                                className="btn-slot-unblock"
                                                onClick={() => handleToggleBlock(s._id)}
                                                title="Restore slot to available"
                                              >
                                                <Unlock size={12} /> Unblock
                                              </button>
                                            )}
                                            {s.status !== 'booked' && (
                                              <button 
                                                className="btn-slot-delete"
                                                onClick={() => handleDeleteSlot(s._id, timeStr)}
                                                title="Delete this slot from schedule"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="court-empty-schedule-box">
                                    <Clock size={20} className="empty-clock-icon" />
                                    <h6>No Slots for {selectedSlotDate === todayDateStr ? 'Today' : selectedSlotDate}</h6>
                                    <p>Select a preset below to populate this court immediately:</p>
                                    <div className="empty-quick-presets">
                                      <button 
                                        type="button" 
                                        className="btn-empty-preset"
                                        onClick={() => handleApplyPreset({ sport: sp.name, playing_area: courtName, start_hour: 6, end_hour: 22 })}
                                      >
                                        ⚡ 1-Click Full Day (6 AM – 10 PM)
                                      </button>
                                      <button 
                                        type="button" 
                                        className="btn-empty-preset-secondary"
                                        onClick={() => openCreateSlotModal(sp.name, courtName)}
                                      >
                                        + Add Single Slot
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Court to Sport Footer */}
                        <div className="sport-footer-action">
                          <button 
                            type="button" 
                            className="btn-add-court-to-sport"
                            onClick={() => openAddCourtModal(sp.name)}
                          >
                            <Plus size={14} /> + Add Another Court to {sp.name}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-sports-venue-state">
                  <AlertCircle size={32} />
                  <h4>No Sports Configured for this Facility</h4>
                  <p>Add sports (like Badminton, Cricket, Tennis) in the "My Venues" tab to start managing court availability.</p>
                </div>
              )}

              {/* Single Custom Slot Creator Modal */}
              {singleSlotModalOpen && (
                <div className="modal-backdrop" onClick={() => setSingleSlotModalOpen(false)}>
                  <div className="modal-card modal-single-slot-custom" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setSingleSlotModalOpen(false)}>
                      <X size={18} />
                    </button>
                    <div className="custom-modal-head">
                      <div className="custom-modal-icon">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3>Publish Custom Time Slot</h3>
                        <p>{customSlotData.sport} • {customSlotData.playing_area}</p>
                      </div>
                    </div>

                    <form onSubmit={handlePublishCustomSlot} className="custom-slot-form">
                      <div className="form-group">
                        <label>Date</label>
                        <input 
                          type="date"
                          required
                          value={customSlotData.date}
                          onChange={e => setCustomSlotData({ ...customSlotData, date: e.target.value })}
                          className="modern-form-input"
                        />
                      </div>

                      <div className="form-group-row">
                        <div className="gen-input-group">
                          <label>Start Time</label>
                          <input 
                            type="time"
                            required
                            value={customSlotData.start_time}
                            onChange={e => setCustomSlotData({ ...customSlotData, start_time: e.target.value })}
                            className="modern-form-input"
                          />
                        </div>
                        <div className="gen-input-group">
                          <label>End Time</label>
                          <input 
                            type="time"
                            required
                            value={customSlotData.end_time}
                            onChange={e => setCustomSlotData({ ...customSlotData, end_time: e.target.value })}
                            className="modern-form-input"
                          />
                        </div>
                      </div>

                      <div className="form-group-row">
                        <div className="gen-input-group">
                          <label>Sport</label>
                          <input 
                            type="text"
                            disabled
                            value={customSlotData.sport}
                            className="modern-form-input disabled"
                          />
                        </div>
                        <div className="gen-input-group">
                          <label>Court / Playing Area</label>
                          <input 
                            type="text"
                            disabled
                            value={customSlotData.playing_area}
                            className="modern-form-input disabled"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Hourly Price (₹)</label>
                        <div className="input-with-currency">
                          <span className="currency-prefix">₹</span>
                          <input 
                            type="number"
                            required
                            value={customSlotData.price}
                            onChange={e => setCustomSlotData({ ...customSlotData, price: e.target.value })}
                            className="modern-form-input"
                          />
                        </div>
                      </div>

                      <div className="custom-modal-actions">
                        <button type="button" className="btn-cancel-modal" onClick={() => setSingleSlotModalOpen(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="btn-confirm-modal">
                          <Plus size={15} /> Publish Slot
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Add New Court Modal */}
              {addCourtModalOpen && (
                <div className="modal-backdrop" onClick={() => setAddCourtModalOpen(false)}>
                  <div className="modal-card modal-court-action" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setAddCourtModalOpen(false)}>
                      <X size={18} />
                    </button>
                    <div className="custom-modal-head">
                      <div className="custom-modal-icon court-icon-green">
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3>Add Court to {addCourtData.sport}</h3>
                        <p>Configure and publish a new playing area for this venue</p>
                      </div>
                    </div>

                    <form onSubmit={handleConfirmAddCourt} className="court-action-form">
                      {/* Quick Suggestions */}
                      <div className="court-suggestions-wrap">
                        <span className="suggestions-label">⚡ Quick Suggestions:</span>
                        <div className="suggestions-chips-row">
                          {[
                            `${addCourtData.sport} Court 1`,
                            `${addCourtData.sport} Court 2`,
                            `${addCourtData.sport} Court 3`,
                            `${addCourtData.sport} Court 4`,
                            `${addCourtData.sport} Turf A`,
                            `Main Court`,
                            `VIP Turf 1`
                          ].map(sug => (
                            <button
                              key={sug}
                              type="button"
                              className="suggestion-chip-btn"
                              onClick={() => setAddCourtData(prev => ({ ...prev, courtName: sug }))}
                            >
                              + {sug}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Court / Playing Area Name *</label>
                        <input
                          type="text"
                          required
                          placeholder={`e.g. ${addCourtData.sport} Court 3`}
                          value={addCourtData.courtName}
                          onChange={e => setAddCourtData(prev => ({ ...prev, courtName: e.target.value }))}
                          className="modern-form-input"
                          autoFocus
                        />
                      </div>

                      <div className="court-auto-slots-box">
                        <label className="checkbox-toggle-label">
                          <input
                            type="checkbox"
                            checked={addCourtData.autoGenerate}
                            onChange={e => setAddCourtData(prev => ({ ...prev, autoGenerate: e.target.checked }))}
                          />
                          <span>⚡ Auto-generate 1-hour slots for {selectedSlotDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedSlotDate}</span>
                        </label>

                        {addCourtData.autoGenerate && (
                          <div className="auto-slot-hours-row">
                            <div className="hour-select-wrap">
                              <label>From Hour:</label>
                              <input
                                type="number"
                                min="0"
                                max="23"
                                value={addCourtData.startHour}
                                onChange={e => setAddCourtData(prev => ({ ...prev, startHour: e.target.value }))}
                                className="hour-input"
                              />
                              <span>:00</span>
                            </div>
                            <div className="hour-select-wrap">
                              <label>To Hour:</label>
                              <input
                                type="number"
                                min="1"
                                max="24"
                                value={addCourtData.endHour}
                                onChange={e => setAddCourtData(prev => ({ ...prev, endHour: e.target.value }))}
                                className="hour-input"
                              />
                              <span>:00</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="custom-modal-actions">
                        <button
                          type="button"
                          className="btn-cancel-modal"
                          onClick={() => setAddCourtModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn-confirm-modal">
                          <Plus size={15} /> Add Court & Publish
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Court Confirmation Modal */}
              {deleteCourtModalOpen && (
                <div className="modal-backdrop" onClick={() => setDeleteCourtModalOpen(false)}>
                  <div className="modal-card modal-court-action modal-danger" onClick={e => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setDeleteCourtModalOpen(false)}>
                      <X size={18} />
                    </button>
                    <div className="custom-modal-head">
                      <div className="custom-modal-icon court-icon-red">
                        <Trash2 size={20} />
                      </div>
                      <div>
                        <h3>Delete Court</h3>
                        <p>Permanently remove court from this facility</p>
                      </div>
                    </div>

                    <div className="court-delete-body">
                      <div className="court-delete-details-box">
                        <div className="detail-line">
                          <span className="detail-key">Court Name:</span>
                          <b className="detail-val">{courtToDelete.courtName}</b>
                        </div>
                        <div className="detail-line">
                          <span className="detail-key">Associated Sport:</span>
                          <span className="detail-val">{courtToDelete.sport}</span>
                        </div>
                        <div className="detail-line">
                          <span className="detail-key">Total Scheduled Sessions:</span>
                          <span className="detail-val">{courtToDelete.slotsCount} slots</span>
                        </div>
                        <div className="detail-line">
                          <span className="detail-key">Confirmed Bookings:</span>
                          <span className={`detail-val ${courtToDelete.bookedCount > 0 ? 'booked-alert' : ''}`}>
                            {courtToDelete.bookedCount > 0 ? `⚠️ ${courtToDelete.bookedCount} active booking(s)` : '0 active bookings'}
                          </span>
                        </div>
                      </div>

                      {courtToDelete.bookedCount > 0 ? (
                        <div className="court-alert-box-danger">
                          <AlertCircle size={20} />
                          <div>
                            <strong>Cannot Delete Court with Active Bookings</strong>
                            <p>This court currently has {courtToDelete.bookedCount} active customer reservation(s). You must cancel or complete those reservations before deleting this court.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="court-alert-box-warning">
                          <AlertCircle size={20} />
                          <div>
                            <strong>Are you sure?</strong>
                            <p>Deleting this court will remove it from the venue's active playing areas and delete all unbooked slots scheduled on this court.</p>
                          </div>
                        </div>
                      )}

                      <div className="custom-modal-actions">
                        <button
                          type="button"
                          className="btn-cancel-modal"
                          onClick={() => setDeleteCourtModalOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn-danger-confirm-action"
                          onClick={handleConfirmDeleteCourt}
                          disabled={courtToDelete.bookedCount > 0}
                        >
                          <Trash2 size={14} /> Delete Court & Slots
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 4. Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="owner-bookings-section">
            <div className="section-head">
              <h3>Customer & Walk-in Reservations</h3>
              <p>Mark sessions completed when played, or view invoices.</p>
            </div>

            <div className="table-responsive">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Facility & Court</th>
                    <th>Schedule</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id}>
                      <td>
                        <b>{b.customer_name}</b>
                        {b.customer_phone && <br />}
                        {b.customer_phone && <small>{b.customer_phone}</small>}
                      </td>
                      <td>
                        <b>{b.facility?.name}</b><br />
                        <small>{b.sport} · {b.playing_area}</small>
                      </td>
                      <td>
                        {b.slot?.start_at ? new Date(b.slot.start_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </td>
                      <td>
                        <span className={`type-tag ${b.type}`}>
                          {b.type === 'offline' ? 'Walk-in' : 'Online'}
                        </span>
                      </td>
                      <td><b>₹{b.amount}</b></td>
                      <td>
                        <span className={`badge-status ${b.status}`}>{b.status}</span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {b.status === 'confirmed' && (
                            <button 
                              className="btn-sm-solid"
                              onClick={() => handleCompleteBooking(b._id)}
                              title="Mark session complete so customer can review"
                            >
                              Complete ✓
                            </button>
                          )}
                          <button 
                            className="btn-sm-action"
                            onClick={() => setViewReceiptId(b._id)}
                          >
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center">No bookings recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="owner-reviews-section">
            <div className="section-head">
              <h3>Customer Feedback & Ratings</h3>
              <p>Verified reviews submitted by players who completed sessions at your venues.</p>
            </div>

            <div className="reviews-cards-list">
              {reviews.map(r => (
                <div key={r._id} className="owner-review-box">
                  <div className="rev-head">
                    <div>
                      <b>{r.facility_name}</b> · <small>{r.user_name}</small>
                    </div>
                    <div className="rev-rating">
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)} ({r.rating}/5)
                    </div>
                  </div>
                  <p className="rev-text">"{r.comment}"</p>
                  <small className="rev-time">
                    {new Date(r.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                  </small>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="empty-state-card">
                  <p>No customer reviews received yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Facility Create/Edit Modal */}
      {facilityModalOpen && (
        <div className="modal-backdrop" onClick={() => setFacilityModalOpen(false)}>
          <div className="modal-card modal-large-venue-editor" onClick={e => e.stopPropagation()}>
            <div className="venue-modal-header">
              <div className="header-info">
                <span className="modal-kicker">VENUE CONFIGURATION CONSOLE</span>
                <h3>{editingFacilityId ? 'Edit Sports Facility' : 'Register New Sports Venue'}</h3>
                <p>Configure venue identity, dynamic sports pricing, court numbers, amenities, and GPS coordinates.</p>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setFacilityModalOpen(false)} title="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="venue-editor-modern-form">
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="editor-form-card">
                <div className="card-heading-row">
                  <span className="card-step-num">1</span>
                  <div>
                    <h5>Basic Information & Operating Hours</h5>
                    <small>Venue name, contact details, and daily operating schedule</small>
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-input-box">
                    <label>Facility / Venue Name *</label>
                    <input 
                      type="text"
                      required 
                      placeholder="e.g. Smash Point Badminton & Sports Arena"
                      value={facilityForm.name}
                      onChange={e => setFacilityForm({ ...facilityForm, name: e.target.value })}
                      className="editor-text-input"
                    />
                  </div>

                  <div className="form-input-box">
                    <label>Contact Phone Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={facilityForm.phone}
                      onChange={e => setFacilityForm({ ...facilityForm, phone: e.target.value })}
                      className="editor-text-input"
                    />
                  </div>
                </div>

                <div className="form-grid-two">
                  <div className="form-input-box">
                    <label>Daily Opening Time</label>
                    <input 
                      type="time"
                      value={facilityForm.opening_time}
                      onChange={e => setFacilityForm({ ...facilityForm, opening_time: e.target.value })}
                      className="editor-text-input"
                    />
                  </div>

                  <div className="form-input-box">
                    <label>Daily Closing Time</label>
                    <input 
                      type="time"
                      value={facilityForm.closing_time}
                      onChange={e => setFacilityForm({ ...facilityForm, closing_time: e.target.value })}
                      className="editor-text-input"
                    />
                  </div>
                </div>

                <div className="form-input-box">
                  <label>Venue Description & Highlights</label>
                  <textarea 
                    rows={2}
                    placeholder="Tell players about court flooring (e.g. BWF wooden, synthetic turf), lighting, locker rooms..."
                    value={facilityForm.description}
                    onChange={e => setFacilityForm({ ...facilityForm, description: e.target.value })}
                    className="editor-textarea"
                  />
                </div>
              </div>

              {/* SECTION 2: ADDRESS & GPS MAP PICKER */}
              <div className="editor-form-card">
                <div className="card-heading-row">
                  <span className="card-step-num">2</span>
                  <div>
                    <h5>Address & GPS Coordinates</h5>
                    <small>Pinpoint your exact venue location for accurate player navigation</small>
                  </div>
                </div>

                <div className="form-grid-three">
                  <div className="form-input-box">
                    <label>Locality / Area *</label>
                    <input 
                      type="text"
                      required 
                      placeholder="e.g. Hanamkonda / Nakkalagutta"
                      value={facilityForm.locality}
                      onChange={e => setFacilityForm({ ...facilityForm, locality: e.target.value })}
                      className="editor-text-input"
                    />
                  </div>

                  <div className="form-input-box">
                    <label>City *</label>
                    <input 
                      type="text"
                      required 
                      placeholder="e.g. Warangal"
                      value={facilityForm.city}
                      onChange={e => setFacilityForm({ ...facilityForm, city: e.target.value })}
                      className="editor-text-input"
                    />
                  </div>

                  <div className="form-input-box">
                    <label>State & Pincode</label>
                    <div className="input-split-pair">
                      <input 
                        type="text"
                        placeholder="State"
                        value={facilityForm.state}
                        onChange={e => setFacilityForm({ ...facilityForm, state: e.target.value })}
                        className="editor-text-input"
                      />
                      <input 
                        type="text"
                        placeholder="Pincode"
                        value={facilityForm.pincode}
                        onChange={e => setFacilityForm({ ...facilityForm, pincode: e.target.value })}
                        className="editor-text-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-input-box">
                  <label>Street Address</label>
                  <input 
                    type="text"
                    placeholder="e.g. Opp. NIT Main Gate, Kazipet Main Road"
                    value={facilityForm.street}
                    onChange={e => setFacilityForm({ ...facilityForm, street: e.target.value })}
                    className="editor-text-input"
                  />
                </div>

                {/* Map Picker */}
                <div className="form-input-box">
                  <div className="map-picker-header">
                    <label>Pinpoint Venue Location on Map:</label>
                    <span className="coords-readout">
                      Lat: {Number(facilityForm.latitude).toFixed(4)}, Lng: {Number(facilityForm.longitude).toFixed(4)}
                    </span>
                  </div>
                  <MapPicker
                    latitude={facilityForm.latitude}
                    longitude={facilityForm.longitude}
                    onChange={(lat, lng) => {
                      setFacilityForm(f => ({ ...f, latitude: lat, longitude: lng }));
                    }}
                  />
                </div>
              </div>

              {/* SECTION 3: DYNAMIC SPORTS & RATES BUILDER */}
              <div className="editor-form-card">
                <div className="card-heading-row">
                  <span className="card-step-num">3</span>
                  <div>
                    <h5>Available Sports & Hourly Pricing</h5>
                    <small>Add any sport with custom hourly rates (Pickleball, Futsal, Badminton, Box Cricket, etc.)</small>
                  </div>
                </div>

                {/* Quick 1-Click Sport Presets */}
                <div className="presets-bar-wrap">
                  <span className="presets-bar-label">⚡ 1-Click Sport Presets:</span>
                  <div className="presets-chips-row">
                    {PRESET_SPORTS.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        className="btn-sport-preset-chip"
                        onClick={() => handleAddPresetSport(p)}
                      >
                        + {p.name} (₹{p.price}/hr)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Sports Table / List */}
                <div className="active-sports-table">
                  <div className="sports-table-header">
                    <span>Sport</span>
                    <span>Hourly Rate (₹)</span>
                    <span>Surface / Court Notes</span>
                    <span>Action</span>
                  </div>
                  {facilityForm.sports.map((sp, idx) => (
                    <div key={idx} className="sports-table-row">
                      <div className="sport-name-cell">
                        <span className="sport-emoji-icon">{getSportIcon(sp.name)}</span>
                        <b>{sp.name}</b>
                      </div>

                      <div className="sport-price-cell">
                        <span className="currency-symbol">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={sp.price_per_hour}
                          onChange={e => handleUpdateSportPrice(idx, e.target.value)}
                          className="sport-price-field"
                        />
                        <span className="per-hr-tag">/hr</span>
                      </div>

                      <div className="sport-desc-cell">
                        <input
                          type="text"
                          placeholder="e.g. Synthetic BWF mat, LED lights"
                          value={sp.description || ''}
                          onChange={e => {
                            const newDesc = e.target.value;
                            setFacilityForm(prev => ({
                              ...prev,
                              sports: prev.sports.map((s, i) => i === idx ? { ...s, description: newDesc } : s)
                            }));
                          }}
                          className="sport-desc-field"
                        />
                      </div>

                      <div className="sport-delete-cell">
                        <button
                          type="button"
                          className="btn-del-sport"
                          onClick={() => handleRemoveSport(idx)}
                          title="Remove this sport"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Sport Add Form */}
                <div className="custom-sport-add-row">
                  <input
                    type="text"
                    placeholder="Custom Sport Name (e.g. Squash, Padel)"
                    value={customSportInput.name}
                    onChange={e => setCustomSportInput({ ...customSportInput, name: e.target.value })}
                    className="custom-sport-name-input"
                  />
                  <input
                    type="number"
                    placeholder="Rate ₹/hr"
                    value={customSportInput.price}
                    onChange={e => setCustomSportInput({ ...customSportInput, price: e.target.value })}
                    className="custom-sport-price-input"
                  />
                  <input
                    type="text"
                    placeholder="Surface / Note"
                    value={customSportInput.desc}
                    onChange={e => setCustomSportInput({ ...customSportInput, desc: e.target.value })}
                    className="custom-sport-desc-input"
                  />
                  <button
                    type="button"
                    className="btn-add-custom-sport"
                    onClick={handleAddCustomSport}
                  >
                    <Plus size={14} /> Add Sport
                  </button>
                </div>
              </div>

              {/* SECTION 4: PLAYING AREAS & COURTS BUILDER */}
              <div className="editor-form-card">
                <div className="card-heading-row">
                  <span className="card-step-num">4</span>
                  <div>
                    <h5>Playing Areas & Court Numbers</h5>
                    <small>Configure each court or pitch so slots can be booked and managed individually</small>
                  </div>
                </div>

                {/* Quick Court Presets */}
                <div className="presets-bar-wrap">
                  <span className="presets-bar-label">⚡ Quick Presets:</span>
                  <div className="presets-chips-row">
                    {['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Turf Pitch A', 'Turf Pitch B', 'Box Cricket Turf 1'].map(name => (
                      <button
                        key={name}
                        type="button"
                        className="btn-court-preset-chip"
                        onClick={() => handleAddCourt(name)}
                      >
                        + {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Courts Chip List */}
                <div className="active-courts-chips-list">
                  {facilityForm.playing_areas.map((courtName) => (
                    <span key={courtName} className="active-court-badge">
                      <span>🏟️ {courtName}</span>
                      <button
                        type="button"
                        className="btn-remove-court-chip"
                        onClick={() => handleRemoveCourt(courtName)}
                        title={`Remove ${courtName}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Custom Court Input */}
                <div className="custom-court-add-row">
                  <input
                    type="text"
                    placeholder="Enter court / pitch name (e.g. Badminton Court 5, VIP Turf)"
                    value={customCourtInput}
                    onChange={e => setCustomCourtInput(e.target.value)}
                    className="custom-court-input"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCourt();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-add-court-action"
                    onClick={() => handleAddCourt()}
                  >
                    <Plus size={14} /> Add Court
                  </button>
                </div>
              </div>

              {/* SECTION 5: AMENITIES QUICK SELECTOR */}
              <div className="editor-form-card">
                <div className="card-heading-row">
                  <span className="card-step-num">5</span>
                  <div>
                    <h5>Venue Amenities</h5>
                    <small>Click to toggle available player amenities at this venue</small>
                  </div>
                </div>

                <div className="amenities-toggle-grid">
                  {AVAILABLE_AMENITIES.map(amenity => {
                    const isSelected = facilityForm.amenities.includes(amenity.name);
                    return (
                      <button
                        key={amenity.name}
                        type="button"
                        className={`amenity-toggle-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleAmenity(amenity.name)}
                      >
                        <span className="amenity-icon">{amenity.icon}</span>
                        <span className="amenity-name">{amenity.name}</span>
                        {isSelected && <Check size={13} className="amenity-check-icon" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 6: VENUE PHOTOS */}
              <div className="editor-form-card">
                <div className="card-heading-row">
                  <span className="card-step-num">6</span>
                  <div>
                    <h5>Venue Photo & Visual Preview</h5>
                    <small>Provide high-resolution image URLs to showcase your facility to players</small>
                  </div>
                </div>

                {/* Preset Photos */}
                <div className="presets-bar-wrap">
                  <span className="presets-bar-label">⚡ Sample Arena Photos:</span>
                  <div className="presets-chips-row">
                    {[
                      { label: 'Badminton Arena', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Turf Ground', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Tennis Arena', url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&auto=format&fit=crop&q=80' },
                      { label: 'Multi-sport Complex', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80' }
                    ].map(sample => (
                      <button
                        key={sample.label}
                        type="button"
                        className="btn-photo-preset-chip"
                        onClick={() => {
                          if (!facilityForm.images.includes(sample.url)) {
                            setFacilityForm(prev => ({
                              ...prev,
                              images: [sample.url, ...prev.images]
                            }));
                          }
                        }}
                      >
                        + {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo URL Input */}
                <div className="photo-add-row">
                  <input
                    type="url"
                    placeholder="Paste image URL (https://...)"
                    value={customPhotoInput}
                    onChange={e => setCustomPhotoInput(e.target.value)}
                    className="photo-url-input"
                  />
                  <button
                    type="button"
                    className="btn-add-photo"
                    onClick={handleAddPhoto}
                  >
                    <Plus size={14} /> Add Photo
                  </button>
                </div>

                {/* Photo Previews */}
                <div className="photos-preview-gallery">
                  {facilityForm.images.map((imgUrl, idx) => (
                    <div key={idx} className="photo-preview-card">
                      <img src={imgUrl} alt={`Venue preview ${idx + 1}`} />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => handleRemovePhoto(idx)}
                        title="Remove photo"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODAL ACTIONS BAR */}
              <div className="venue-modal-actions-bar">
                <button 
                  type="button" 
                  className="btn-venue-modal-cancel" 
                  onClick={() => setFacilityModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-venue-modal-submit">
                  {editingFacilityId ? 'Save Venue Changes' : '✓ Register Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offline Booking Walk-in Modal */}
      {offlineModalSlot && (
        <div className="modal-backdrop" onClick={() => setOfflineModalSlot(null)}>
          <div className="modal-card modal-offline" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Record Walk-in Booking</h3>
              <p>
                Locking slot: <b>{new Date(offlineModalSlot.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b> ({offlineModalSlot.sport} · {offlineModalSlot.playing_area})
              </p>
            </div>

            <form onSubmit={handleCreateOfflineBooking} className="offline-form">
              <div className="form-group">
                <label>Customer Name:</label>
                <input 
                  required
                  placeholder="Customer Full Name"
                  value={offlineForm.customer_name}
                  onChange={e => setOfflineForm({ ...offlineForm, customer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone:</label>
                <input 
                  placeholder="+91 98765 43210"
                  value={offlineForm.customer_phone}
                  onChange={e => setOfflineForm({ ...offlineForm, customer_phone: e.target.value })}
                />
              </div>

              <div className="form-group-row">
                <div>
                  <label>Amount Collected (₹):</label>
                  <input 
                    type="number"
                    required
                    value={offlineForm.amount}
                    onChange={e => setOfflineForm({ ...offlineForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label>Payment Method:</label>
                  <select 
                    value={offlineForm.payment_method}
                    onChange={e => setOfflineForm({ ...offlineForm, payment_method: e.target.value })}
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="UPI">UPI at Desk</option>
                    <option value="Card POS">Card POS</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions-bar">
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => setOfflineModalSlot(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-solid">
                  Confirm Offline Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {viewReceiptId && (
        <ReceiptModal
          bookingId={viewReceiptId}
          onClose={() => setViewReceiptId(null)}
        />
      )}
    </div>
  );
}
