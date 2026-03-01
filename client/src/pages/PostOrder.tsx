import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import VideoUpload from '../components/VideoUpload';
import PaymentForm from '../components/PaymentForm';
import MatchSelection from '../components/MatchSelection';
import { 
  calculateDeliveryFeeFromPartnerRates, 
  extractPricingRatesFromTransaction
} from '../utils/partnerPricing';

// Define type locally to avoid import issues
type PartnerPricingRates = {
  pieceRates?: Array<{
    quantity: string;
    quantityRange?: { min: number; max: number } | null;
    averageQuantity: number;
    rate: number;
  }>;
  weightRates?: Array<{
    quantity: string;
    quantityRange?: { min: number; max: number } | null;
    averageQuantity: number;
    rate: number;
  }>;
  distanceRates?: Array<{
    quantity: string;
    quantityRange?: { min: number; max: number } | null;
    averageQuantity: number;
    rate: number;
  }>;
  extraFees?: number;
};

function PostOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    // Buyer Information
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    telegram: '',
    currentCity: '',
    location: '',
    deliveryDestination: '',
    deliveryCity: '',
    deliverySubcity: '',
    deliveryStreetAddress: '',
    deliveryAdditionalInfo: '',
    idDocument: '',
    // Delivery Method
    deliveryMethod: 'traveler' as 'traveler' | 'delivery_partner' | 'acha_sisters_delivery_partner' | 'movers_packers' | 'gift_delivery_partner',
    // Order Information
    productName: '',
    productDescription: '',
    brand: '',
    quantityType: 'pieces' as 'pieces' | 'weight',
    quantityDescription: '',
    manufacturingDate: '',
    countryOfOrigin: '',
    preferredDeliveryDate: '',
    // Attachments
    photos: [] as string[],
    video: '',
    link: '',
    // Gift Delivery Partner specific fields
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientAddress: '',
    giftType: '',
    giftMessage: '',
    partnerType: '',
    selectedGiftTypeId: '',
    // Movers & Packers specific fields
    pickupAddress: '',
    numberOfItems: '',
    deliveryMechanism: '',
    specialHandling: '',
    estimatedValue: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMatchSelection, setShowMatchSelection] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [createdBuyerId, setCreatedBuyerId] = useState<string>('');
  const [availableMatches, setAvailableMatches] = useState<any[]>([]);
  const [matchType, setMatchType] = useState<'traveler' | 'partner' | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  
  // Gift Delivery Partner specific state
  const [giftPartners, setGiftPartners] = useState<any[]>([]);
  const [selectedPartnerType, setSelectedPartnerType] = useState<string>('');
  const [availableGiftTypes, setAvailableGiftTypes] = useState<any[]>([]);
  const [selectedGiftType, setSelectedGiftType] = useState<any>(null);
  const [loadingGiftPartners, setLoadingGiftPartners] = useState(false);
  
  // Partner pricing rates state
  const [partnerPricingRates, setPartnerPricingRates] = useState<PartnerPricingRates | null>(null);
  const [orderDistance] = useState<number | undefined>(undefined);

  // Pre-fill form data if trip was selected from BrowseTrips
  useEffect(() => {
    if (location.state?.selectedTrip) {
      const trip = location.state.selectedTrip;
      setSelectedTrip(trip);
      console.log('Selected trip data:', trip);
      console.log('Price offer from trip:', trip.priceOffer);
      
      // Pre-fill form with trip information
      setFormData(prev => ({
        ...prev,
        deliveryMethod: 'traveler',
        currentCity: trip.currentLocation || prev.currentCity,
        deliveryDestination: trip.destinationCity || prev.deliveryDestination,
        preferredDeliveryDate: trip.departureDate 
          ? new Date(trip.departureDate).toISOString().split('T')[0] 
          : prev.preferredDeliveryDate
      }));
    }
  }, [location.state]);

  // Load gift delivery partners when gift_delivery_partner is selected
  useEffect(() => {
    if (formData.deliveryMethod === 'gift_delivery_partner') {
      loadGiftDeliveryPartners();
    } else {
      setGiftPartners([]);
      setSelectedPartnerType('');
      setAvailableGiftTypes([]);
      setSelectedGiftType(null);
    }
  }, [formData.deliveryMethod]);

  // Recalculate fees when partner pricing rates change
  useEffect(() => {
    if (partnerPricingRates && createdOrder && showPayment) {
      // Fees will be recalculated when calculateFees is called
      console.log('Partner pricing rates updated, fees will be recalculated');
    }
  }, [partnerPricingRates, createdOrder, showPayment]);

  // Refresh order when partner is matched to get updated pricing from backend
  useEffect(() => {
    if (createdOrder?._id && createdOrder?.assignedPartnerId && showPayment && !createdOrder.pricing?.deliveryFee) {
      // Order has assigned partner but no pricing yet - refresh to get backend-calculated fee
      const refreshOrder = async () => {
        try {
          const updatedOrder = await api.orders.getById(createdOrder._id) as { status?: string; data?: any };
          if (updatedOrder.status === 'success' && updatedOrder.data?.pricing?.deliveryFee) {
            setCreatedOrder(updatedOrder.data);
            console.log('Order refreshed with backend-calculated delivery fee:', updatedOrder.data.pricing.deliveryFee);
          }
        } catch (error) {
          console.error('Error refreshing order for pricing:', error);
        }
      };
      refreshOrder();
    }
  }, [createdOrder?._id, createdOrder?.assignedPartnerId, showPayment]);

  // Poll for partner acceptance when partner is assigned but not yet accepted
  useEffect(() => {
    if (createdOrder?._id && createdOrder?.assignedPartnerId && createdOrder?.partnerAcceptanceStatus !== 'accepted' && showPayment) {
      const pollInterval = setInterval(async () => {
        try {
          const updatedOrder = await api.orders.getById(createdOrder._id) as { status?: string; data?: any };
          if (updatedOrder.status === 'success' && updatedOrder.data) {
            // Check if partner has accepted
            if (updatedOrder.data.partnerAcceptanceStatus === 'accepted') {
              setCreatedOrder(updatedOrder.data);
              setMessage({ 
                type: 'success', 
                text: 'Great news! The delivery partner has accepted your order and confirmed the final price. Please proceed with payment.'
              });
              clearInterval(pollInterval);
            }
          }
        } catch (error) {
          console.error('Error polling for partner acceptance:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup interval on unmount or when partner accepts
      return () => clearInterval(pollInterval);
    }
  }, [createdOrder?._id, createdOrder?.assignedPartnerId, createdOrder?.partnerAcceptanceStatus, showPayment]);

  // Update available gift types when partner type is selected
  useEffect(() => {
    if (selectedPartnerType && giftPartners.length > 0) {
      console.log('Filtering partners by type:', selectedPartnerType);
      console.log('Available partners:', giftPartners.map((p: any) => ({ 
        name: p.name, 
        type: p.partnerType, 
        giftCount: p.giftTypes?.length || 0,
        giftTypes: p.giftTypes 
      })));
      
      // Use case-insensitive and trimmed comparison
      const partnersOfType = giftPartners.filter((p: any) => {
        const partnerType = (p.partnerType || '').trim();
        const selectedType = (selectedPartnerType || '').trim();
        const match = partnerType.toLowerCase() === selectedType.toLowerCase();
        console.log(`Partner ${p.name}: type="${partnerType}", selected="${selectedType}", match=${match}`);
        return match;
      });
      
      console.log('Partners of selected type:', partnersOfType.length);
      
      const allGiftTypes: any[] = [];
      
      partnersOfType.forEach((partner: any) => {
        console.log(`Processing partner ${partner.name}, giftTypes:`, partner.giftTypes);
        if (partner.giftTypes && Array.isArray(partner.giftTypes) && partner.giftTypes.length > 0) {
          partner.giftTypes.forEach((gt: any, index: number) => {
            if (gt && (gt.type || gt.description)) { // Only add if gift type has required fields
              allGiftTypes.push({
                ...gt,
                _id: gt._id || `${partner._id}_${index}`, // Add unique ID if not present
                partnerId: partner._id,
                partnerName: partner.name,
                partnerCity: partner.city,
                partnerLocation: partner.primaryLocation
              });
            }
          });
        } else {
          console.log(`Partner ${partner.name} has no valid gift types`);
        }
      });
      
      console.log('Available gift types after filtering:', allGiftTypes.length, allGiftTypes);
      setAvailableGiftTypes(allGiftTypes);
      setSelectedGiftType(null);
      setFormData(prev => ({ ...prev, selectedGiftTypeId: '' }));
    } else {
      setAvailableGiftTypes([]);
      setSelectedGiftType(null);
    }
  }, [selectedPartnerType, giftPartners]);

  const loadGiftDeliveryPartners = async () => {
    try {
      setLoadingGiftPartners(true);
      const response = await api.partners.getAll({ 
        registrationType: 'Gift Delivery Partner'
        // Removed status filter to get all partners - they can be pending, approved, etc.
      }) as { status?: string; data?: any[] };
      
      if (response.status === 'success' && response.data) {
        console.log('Raw partners response:', response.data);
        
        // Filter partners that have gift types
        const partnersWithGifts = response.data.filter((p: any) => {
          const hasGifts = p.giftTypes && Array.isArray(p.giftTypes) && p.giftTypes.length > 0;
          console.log(`Partner ${p.name}: hasGifts=${hasGifts}, giftTypes=`, p.giftTypes);
          return hasGifts;
        });
        
        setGiftPartners(partnersWithGifts);
        console.log('Loaded gift partners:', partnersWithGifts.length);
        console.log('All partner types in database:', [...new Set(response.data.map((p: any) => p.partnerType))]);
        console.log('Partner types with gifts:', [...new Set(partnersWithGifts.map((p: any) => p.partnerType))]);
        
        // Log each partner's details
        partnersWithGifts.forEach((p: any) => {
          console.log(`Partner: ${p.name}, Type: "${p.partnerType}", Gifts: ${p.giftTypes?.length || 0}`);
        });
      }
    } catch (error) {
      console.error('Error loading gift delivery partners:', error);
      setMessage({ type: 'error', text: 'Failed to load gift delivery partners' });
    } finally {
      setLoadingGiftPartners(false);
    }
  };

  const handlePartnerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedPartnerType(value);
    setFormData(prev => ({ ...prev, partnerType: value }));
  };

  const handleGiftTypeSelect = (giftType: any) => {
    setSelectedGiftType(giftType);
    setFormData(prev => ({ 
      ...prev, 
      selectedGiftTypeId: giftType._id || '',
      giftType: giftType.type || ''
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try {
      const filePath = await api.upload.single(file);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, filePath]
      }));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload photo' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate gift selection for gift_delivery_partner
    if (formData.deliveryMethod === 'gift_delivery_partner') {
      if (!selectedPartnerType) {
        setMessage({ type: 'error', text: 'Please select a Partner Type' });
        setLoading(false);
        return;
      }
      if (!selectedGiftType) {
        setMessage({ type: 'error', text: 'Please select a gift from the available options' });
        setLoading(false);
        return;
      }
    }

    try {
      // Step 1: Create buyer first
      const buyerData: any = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        whatsapp: formData.whatsapp || undefined,
        telegram: formData.telegram || undefined,
        currentCity: formData.currentCity,
        location: formData.location || undefined,
        idDocument: formData.idDocument || undefined,
        deliveryMethod: formData.deliveryMethod
      };

      const buyerResponse = await api.buyers.create(buyerData) as { status?: string; data?: any; message?: string };
      
      if (buyerResponse.status !== 'success' || !buyerResponse.data?._id) {
        throw new Error(buyerResponse.message || 'Failed to create buyer');
      }

      const buyerId = buyerResponse.data._id;

      // Step 2: Create order
      // Combine delivery address fields for non-traveler methods
      let deliveryDestination = formData.deliveryDestination;
      if (formData.deliveryMethod !== 'traveler') {
        const addressParts = [];
        if (formData.deliveryStreetAddress) addressParts.push(formData.deliveryStreetAddress);
        if (formData.deliverySubcity) addressParts.push(formData.deliverySubcity);
        if (formData.deliveryCity) addressParts.push(formData.deliveryCity);
        if (formData.deliveryAdditionalInfo) addressParts.push(`Additional Info: ${formData.deliveryAdditionalInfo}`);
        deliveryDestination = addressParts.length > 0 ? addressParts.join(', ') : '';
      }

      const orderInfo: any = {
        productDescription: formData.productDescription || undefined,
        brand: formData.brand || undefined,
        quantityType: formData.quantityType || undefined,
        quantityDescription: formData.quantityDescription || undefined,
        manufacturingDate: formData.manufacturingDate ? new Date(formData.manufacturingDate).toISOString() : undefined,
        countryOfOrigin: formData.countryOfOrigin || undefined,
        deliveryDestination: deliveryDestination || undefined,
        preferredDeliveryDate: formData.preferredDeliveryDate ? new Date(formData.preferredDeliveryDate + 'T00:00:00').toISOString() : undefined,
        photos: formData.photos.length > 0 ? formData.photos : undefined,
        video: formData.video || undefined,
        link: formData.link || undefined
      };

      // Only include productName if not movers_packers or gift_delivery_partner
      if (formData.deliveryMethod !== 'movers_packers' && formData.deliveryMethod !== 'gift_delivery_partner') {
        orderInfo.productName = formData.productName;
      }

      // Add gift-specific fields if delivery method is gift_delivery_partner
      if (formData.deliveryMethod === 'gift_delivery_partner') {
        orderInfo.recipientName = formData.recipientName || undefined;
        orderInfo.recipientEmail = formData.recipientEmail || undefined;
        orderInfo.recipientPhone = formData.recipientPhone || undefined;
        orderInfo.recipientAddress = formData.recipientAddress || undefined;
        orderInfo.giftMessage = formData.giftMessage || undefined;
        
        // Use selected gift type data
        if (selectedGiftType) {
          orderInfo.giftType = selectedGiftType.type || undefined;
          orderInfo.giftDescription = selectedGiftType.description || undefined;
          orderInfo.giftPrice = selectedGiftType.price || undefined;
          orderInfo.giftPhoto = selectedGiftType.photo || undefined;
          orderInfo.partnerType = selectedPartnerType || undefined;
          orderInfo.selectedGiftTypeId = formData.selectedGiftTypeId || undefined;
          orderInfo.giftPartnerId = selectedGiftType.partnerId || undefined;
          orderInfo.giftPartnerName = selectedGiftType.partnerName || undefined;
        }
      }

      // Add movers & packers specific fields if delivery method is movers_packers
      if (formData.deliveryMethod === 'movers_packers') {
        orderInfo.pickupAddress = formData.pickupAddress || undefined;
        orderInfo.numberOfItems = formData.numberOfItems || undefined;
        orderInfo.deliveryMechanism = formData.deliveryMechanism || undefined;
        orderInfo.specialHandling = formData.specialHandling || undefined;
        orderInfo.estimatedValue = formData.estimatedValue || undefined;
      }

      // Remove undefined values from orderInfo
      Object.keys(orderInfo).forEach(key => {
        if (orderInfo[key] === undefined) {
          delete orderInfo[key];
        }
      });

      // Prepare pickup location (current location - where item will be picked up from)
      const pickupAddress = formData.location || formData.currentCity;
      const pickupCity = formData.currentCity;

      // Prepare delivery location (where item will be delivered to)
      let deliveryAddress = '';
      let deliveryCity = '';
      if (formData.deliveryMethod === 'traveler') {
        deliveryAddress = formData.deliveryDestination;
        deliveryCity = formData.deliveryDestination;
      } else {
        const deliveryParts = [];
        if (formData.deliveryStreetAddress) deliveryParts.push(formData.deliveryStreetAddress);
        if (formData.deliverySubcity) deliveryParts.push(formData.deliverySubcity);
        deliveryAddress = deliveryParts.join(', ');
        deliveryCity = formData.deliveryCity;
      }

      const orderData: any = {
        buyerId,
        deliveryMethod: formData.deliveryMethod,
        orderInfo,
        // Add pickup and delivery locations for distance calculation
        pickupLocation: {
          address: pickupAddress,
          city: pickupCity
        },
        deliveryLocation: {
          address: deliveryAddress || deliveryCity,
          city: deliveryCity
        }
      };

      // If a specific trip was selected, include the traveler ID
      if (selectedTrip?.travelerId) {
        orderData.assignedTravelerId = selectedTrip.travelerId;
      }

      // For gift delivery partner orders, auto-assign the partner who owns the selected gift
      if (formData.deliveryMethod === 'gift_delivery_partner' && selectedGiftType?.partnerId) {
        orderData.assignedPartnerId = selectedGiftType.partnerId;
        orderData.status = 'assigned'; // Set status to assigned since partner is pre-selected
      }

      const orderResponse = await api.orders.create(orderData) as { status?: string; data?: any; message?: string };
      
      console.log('Order creation response:', orderResponse);
      
      if (orderResponse.status === 'success') {
        const responseData = orderResponse.data;
        
        console.log('Response data:', responseData);
        console.log('Available matches:', responseData?.availableMatches);
        console.log('Match type:', responseData?.matchType);
        console.log('Match found:', responseData?.matchFound);
        console.log('Auto matched:', responseData?.autoMatched);
        console.log('Auto assigned:', responseData?.autoAssigned);
        
        // Store order and buyer info
        setCreatedOrder(responseData);
        setCreatedBuyerId(buyerId);
        
        // Check if match was automatically found and assigned
        const autoMatched = responseData?.autoMatched || false;
        const autoAssigned = responseData?.autoAssigned || false;
        const matchFound = responseData?.matchFound || false;
        const availableMatches = responseData?.availableMatches || {};
        const matches = availableMatches.all || [];
        const matchTypeValue = responseData?.matchType || null;
        const assignedTraveler = responseData?.assignedTraveler;
        const assignedPartner = responseData?.assignedPartner;
        
        // Get the assigned match ID
        let assignedMatchId = null;
        if (autoMatched && assignedTraveler?._id) {
          assignedMatchId = assignedTraveler._id;
        } else if (autoAssigned && assignedPartner?._id) {
          assignedMatchId = assignedPartner._id;
        } else if (responseData?.assignedTravelerId) {
          assignedMatchId = responseData.assignedTravelerId;
        } else if (responseData?.assignedPartnerId) {
          assignedMatchId = responseData.assignedPartnerId;
        }
        
        console.log(`Auto matched: ${autoMatched}, Auto assigned: ${autoAssigned}, Match found: ${matchFound}, Assigned match ID: ${assignedMatchId}`);
        
        // For gift delivery partner orders with selected gift, skip match selection and go directly to payment
        if (formData.deliveryMethod === 'gift_delivery_partner' && selectedGiftType?.partnerId) {
          // Store assigned partner info in createdOrder
          responseData.assignedMatchId = selectedGiftType.partnerId;
          responseData.assignedPartner = {
            _id: selectedGiftType.partnerId,
            name: selectedGiftType.partnerName,
            city: selectedGiftType.partnerCity,
            location: selectedGiftType.partnerLocation
          };
          responseData.autoAssigned = true;
          setCreatedOrder(responseData);
          
          // Fetch partner pricing rates if this is a delivery partner method
          // Note: For gift delivery partners, pricing is handled via giftType.price, not partner rates
          // So we skip fetching pricing rates for gift_delivery_partner
          
          // Go directly to payment
          setShowPayment(true);
          setMessage({ 
            type: 'success', 
            text: `Order created successfully! Your gift "${selectedGiftType.description}" has been assigned to ${selectedGiftType.partnerName}. Please proceed with payment.`
          });
        }
        // If a trip was pre-selected from BrowseTrips, skip match selection and go directly to payment
        else if (selectedTrip && assignedMatchId) {
          // Store assigned match ID in createdOrder
          responseData.assignedMatchId = assignedMatchId;
          // Ensure the assignedTraveler includes priceOffer from selectedTrip
          if (selectedTrip.priceOffer) {
            if (!responseData.assignedTraveler) {
              responseData.assignedTraveler = {};
            }
            responseData.assignedTraveler.priceOffer = typeof selectedTrip.priceOffer === 'number' 
              ? selectedTrip.priceOffer 
              : parseFloat(selectedTrip.priceOffer);
          }
          setCreatedOrder(responseData);
          
          // Go directly to payment
          setShowPayment(true);
          setMessage({ 
            type: 'success', 
            text: 'Order created successfully! Your selected traveler has been assigned. Please proceed with payment.'
          });
        }
        // Always show match results first before payment (for orders without pre-selected trip)
        else if (matchFound && matches.length > 0 && matchTypeValue) {
          // Matches found - show match selection/confirmation
          setAvailableMatches(matches);
          setMatchType(matchTypeValue);
          setShowMatchSelection(true);
          
          // Store assigned match ID in createdOrder for MatchSelection component
          if (assignedMatchId) {
            responseData.assignedMatchId = assignedMatchId;
            setCreatedOrder(responseData);
            
            // If a partner was auto-assigned, fetch their pricing rates
            if (autoAssigned && assignedPartner && ['delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers'].includes(formData.deliveryMethod)) {
              try {
                const partnerUserId = assignedPartner.userId || assignedPartner._id;
                if (partnerUserId) {
                  await fetchPartnerPricingRates(partnerUserId);
                }
              } catch (error) {
                console.error('Error fetching partner pricing rates during order creation:', error);
                // Don't block order creation if pricing rates can't be fetched
              }
            }
          }
          
          if (autoMatched || autoAssigned) {
            // Match was automatically assigned - show confirmation
            setMessage({ 
              type: 'success', 
              text: `Match found! We've automatically matched you with a ${matchTypeValue === 'traveler' ? 'traveler' : 'delivery partner'}. Please review and confirm, then proceed to payment.`
            });
          } else {
            // Matches found but not auto-assigned - show selection
            setMessage({ 
              type: 'success', 
              text: `Found ${matches.length} ${matchTypeValue === 'traveler' ? 'traveler' : 'partner'}${matches.length > 1 ? 's' : ''} matching your route. Please select one.`
            });
          }
        } else {
          // No matches found at this moment - show message but don't proceed to payment
          setMessage({ 
            type: 'success', 
            text: 'Order created successfully! No match found at this moment. We will email you when a match becomes available.'
          });
        }
      } else {
        setMessage({ type: 'error', text: orderResponse.message || 'Failed to create order. Please try again.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred while posting your order' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setMessage({ 
      type: 'success', 
      text: 'Payment submitted successfully! Your order is being processed.'
    });
    
    // Redirect to order tracking after 2 seconds
    setTimeout(() => {
      if (createdOrder?._id) {
        navigate(`/orders/track/${createdOrder._id}`);
      } else {
        navigate('/');
      }
    }, 2000);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setMessage({ 
      type: 'info', 
      text: 'You can complete payment later from your order tracking page.'
    });
    
    // Redirect to order tracking
    if (createdOrder?._id) {
      navigate(`/orders/track/${createdOrder._id}`);
    }
  };

  const handleMatchSelect = async (matchId: string) => {
    try {
      setLoading(true);
      // Only call API if not already auto-matched/assigned
      const autoMatched = createdOrder?.autoMatched || false;
      const autoAssigned = createdOrder?.autoAssigned || false;
      
      if (!autoMatched && !autoAssigned) {
        // Match not yet assigned - assign it now
        if (matchType === 'traveler') {
          await api.orders.matchWithTraveler(createdOrder._id, matchId);
        } else if (matchType === 'partner') {
          await api.orders.assignToPartner(createdOrder._id, matchId);
          
          // Fetch partner pricing rates for delivery partner methods
          if (['delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers'].includes(formData.deliveryMethod)) {
            try {
              await fetchPartnerPricingRates(matchId);
            } catch (error) {
              console.error('Error fetching partner pricing rates:', error);
              // Don't block match selection if pricing rates can't be fetched
            }
          }
        }
        
        // Refresh order data
        const updatedOrder = await api.orders.getById(createdOrder._id) as { status?: string; data?: any };
        if (updatedOrder.status === 'success') {
          setCreatedOrder(updatedOrder.data);
        }
      } else {
        // If already assigned, still fetch pricing rates if it's a partner
        if (matchType === 'partner' && ['delivery_partner', 'acha_sisters_delivery_partner', 'movers_packers'].includes(formData.deliveryMethod)) {
          try {
            await fetchPartnerPricingRates(matchId);
          } catch (error) {
            console.error('Error fetching partner pricing rates:', error);
            // Don't block match selection if pricing rates can't be fetched
          }
        }
      }
      
      // Proceed to payment after match confirmation
      setShowMatchSelection(false);
      
      // For delivery partners, show estimated payment and wait for partner acceptance
      if (matchType === 'partner') {
        setShowPayment(true);
        setMessage({ 
          type: 'info', 
          text: 'Match confirmed! The delivery partner will review your order and confirm the final price. You\'ll receive an email with the confirmed price once the partner accepts your order.'
        });
      } else {
        // For travelers, proceed directly to payment
        setShowPayment(true);
        setMessage({ 
          type: 'success', 
          text: autoMatched || autoAssigned 
            ? 'Match confirmed! Please proceed with payment.'
            : 'Match selected successfully! Please proceed with payment.'
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to select match. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSkip = () => {
    setShowMatchSelection(false);
    setShowPayment(true);
    setMessage({ 
      type: 'info', 
      text: 'You can select a match later. Proceeding to payment.'
    });
  };

  // Fetch partner pricing rates when a partner is matched
  const fetchPartnerPricingRates = async (partnerIdOrUserId: string) => {
    try {
      // Get all transactions for this partner/user (they store pricing rates)
      // The partnerIdOrUserId could be either a User ID or Partner document ID
      // Try as User ID first (since transactions are stored with buyerId = user ID)
      const transactions = await api.transactions.getByBuyer(partnerIdOrUserId) as { status?: string; data?: any[] };
      if (transactions.status === 'success' && transactions.data) {
        // Find the most recent pricing rate transaction
        const pricingTransactions = transactions.data
          .filter((t: any) => 
            t.transactionType === 'partner_earning_record' && 
            t.paymentMethod === 'manual_partner_entry' &&
            t.paymentDetails &&
            (t.paymentDetails.pieceRates || t.paymentDetails.weightRates || t.paymentDetails.distanceRates)
          )
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (pricingTransactions.length > 0) {
          const rates = extractPricingRatesFromTransaction(pricingTransactions[0]);
          if (rates) {
            setPartnerPricingRates(rates);
            console.log('Loaded partner pricing rates:', rates);
            return rates;
          }
        }
      }
      setPartnerPricingRates(null);
      return null;
    } catch (error) {
      console.error('Error fetching partner pricing rates:', error);
      setPartnerPricingRates(null);
      return null;
    }
  };

  // Calculate fees - use actual price offer from traveler/partner if available, or calculate from partner rates

  const calculateFees = () => {
    try {
      let deliveryFee = 50; // Default delivery fee
      
      // Priority 1: Check if we have a selected trip with price offer (from BrowseTrips)
      if (selectedTrip?.priceOffer) {
        deliveryFee = typeof selectedTrip.priceOffer === 'number' 
          ? selectedTrip.priceOffer 
          : parseFloat(selectedTrip.priceOffer) || 50;
        console.log('Using price offer from selected trip:', deliveryFee);
      }
      // Priority 2: Check if the created order has an assigned traveler with price offer
      else if (createdOrder?.assignedTraveler?.priceOffer) {
        deliveryFee = typeof createdOrder.assignedTraveler.priceOffer === 'number'
          ? createdOrder.assignedTraveler.priceOffer
          : parseFloat(createdOrder.assignedTraveler.priceOffer) || 50;
        console.log('Using price offer from assigned traveler:', deliveryFee);
      }
      // Priority 3: Check if the order has pricing information (from backend calculation - this should be the most accurate)
      else if (createdOrder?.pricing?.deliveryFee && createdOrder.pricing.deliveryFee > 0) {
        deliveryFee = typeof createdOrder.pricing.deliveryFee === 'number'
          ? createdOrder.pricing.deliveryFee
          : parseFloat(createdOrder.pricing.deliveryFee) || 50;
        console.log('Using delivery fee from order pricing (backend calculated):', deliveryFee);
      }
      // Priority 4: Calculate from matched partner's distance pricing (if backend hasn't calculated it yet)
      else if (createdOrder?.assignedMatchId && availableMatches.length > 0 && matchType === 'partner') {
        // Try to find the matched partner in availableMatches
        const matchedPartner = availableMatches.find((m: any) => 
          m._id === createdOrder.assignedMatchId || 
          m.userId === createdOrder.assignedMatchId ||
          m._id === createdOrder.assignedPartnerId
        );
        
        if (matchedPartner?.distancePricing && Array.isArray(matchedPartner.distancePricing) && matchedPartner.distancePricing.length > 0) {
          // Use the first range price as initial estimate (will be recalculated by backend)
          // For under 3km, find the range that includes 3km or less
          const sortedRanges = [...matchedPartner.distancePricing].sort((a, b) => a.minDistance - b.minDistance);
          
          // Find range that covers 3km or less
          for (const range of sortedRanges) {
            if (3 >= range.minDistance && 3 <= range.maxDistance) {
              deliveryFee = range.price;
              console.log(`Using matched partner distance pricing for ~3km: range ${range.minDistance}-${range.maxDistance}km = ${range.price} ETB`);
              break;
            }
          }
          
          // If no range covers 3km, use the first (lowest) range
          if (deliveryFee === 50 && sortedRanges.length > 0) {
            deliveryFee = sortedRanges[0].price;
            console.log(`Using first range price from matched partner: ${deliveryFee} ETB`);
          }
        }
      }
      // Priority 5: Calculate from partner pricing rates if available
      else if (partnerPricingRates && createdOrder?.orderInfo) {
        try {
          const calculatedFee = calculateDeliveryFeeFromPartnerRates(
            partnerPricingRates,
            {
              quantityDescription: createdOrder.orderInfo.quantityDescription || formData.quantityDescription,
              quantityType: createdOrder.orderInfo.quantityType || formData.quantityType
            },
            orderDistance
          );
          if (calculatedFee !== null && calculatedFee > 0) {
            deliveryFee = calculatedFee;
            console.log('Using calculated fee from partner pricing rates:', deliveryFee);
          }
        } catch (calcError) {
          console.error('Error calculating fee from partner rates:', calcError);
          // Fall back to default fee
        }
      }
      // Priority 6: Check if the created order has an assigned partner with price offer
      else if (createdOrder?.assignedPartner?.priceOffer) {
        deliveryFee = typeof createdOrder.assignedPartner.priceOffer === 'number'
          ? createdOrder.assignedPartner.priceOffer
          : parseFloat(createdOrder.assignedPartner.priceOffer) || 50;
        console.log('Using price offer from assigned partner:', deliveryFee);
      }
      // Priority 7: Check if there's a selected match with price offer
      else if (createdOrder?.assignedMatchId && availableMatches.length > 0) {
        // Try to find the match in availableMatches
        const match = availableMatches.find((m: any) => 
          m._id === createdOrder.assignedMatchId || 
          m.userId === createdOrder.assignedMatchId
        );
        if (match?.priceOffer) {
          deliveryFee = typeof match.priceOffer === 'number'
            ? match.priceOffer
            : parseFloat(match.priceOffer) || 50;
          console.log('Using price offer from match:', deliveryFee);
        }
      }
      
      const serviceFee = 25; // Service fee (can be made configurable later)
      const platformFee = 15; // Platform fee (can be made configurable later)
      return {
        deliveryFee: deliveryFee || 50,
        serviceFee: serviceFee || 25,
        platformFee: platformFee || 15,
        total: (deliveryFee || 50) + (serviceFee || 25) + (platformFee || 15)
      };
    } catch (error) {
      console.error('Error calculating fees:', error);
      // Return default fees on error
      return {
        deliveryFee: 50,
        serviceFee: 25,
        platformFee: 15,
        total: 90
      };
    }
  };

  // Calculate item value - prioritize gift price for gift delivery orders
  const itemValue = (() => {
    // For gift delivery orders, use the selected gift price
    if (formData.deliveryMethod === 'gift_delivery_partner' && selectedGiftType?.price) {
      return typeof selectedGiftType.price === 'number' 
        ? selectedGiftType.price 
        : parseFloat(selectedGiftType.price) || 0;
    }
    // If order is created, check orderInfo for gift price
    if (createdOrder?.orderInfo?.giftPrice) {
      return typeof createdOrder.orderInfo.giftPrice === 'number'
        ? createdOrder.orderInfo.giftPrice
        : parseFloat(createdOrder.orderInfo.giftPrice) || 0;
    }
    // Check order pricing if available
    if (createdOrder?.pricing?.itemValue) {
      return typeof createdOrder.pricing.itemValue === 'number'
        ? createdOrder.pricing.itemValue
        : parseFloat(createdOrder.pricing.itemValue) || 0;
    }
    // Default to 0
    return 0;
  })();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Post Your Order</h1>
          {selectedTrip && (
            <div className="mt-4 mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-left max-w-2xl mx-auto">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✈️</span>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Selected Trip
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p><strong>Traveler:</strong> {selectedTrip.travelerName}</p>
                    <p><strong>Route:</strong> {selectedTrip.currentLocation} → {selectedTrip.destinationCity}</p>
                    {selectedTrip.departureDate && (
                      <p><strong>Departure:</strong> {new Date(selectedTrip.departureDate).toISOString().split('T')[0]}</p>
                    )}
                    {selectedTrip.priceOffer && (
                      <p><strong>Price Offer:</strong> ETB {selectedTrip.priceOffer.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Match Selection - Show if matches are available */}
        {showMatchSelection && createdOrder && matchType && (
          <div className="mb-8">
            <MatchSelection
              matches={availableMatches}
              matchType={matchType}
              origin={formData.currentCity}
              destination={formData.deliveryDestination}
              onSelect={handleMatchSelect}
              onSkip={handleMatchSkip}
              autoMatched={createdOrder?.autoMatched || false}
              autoAssigned={createdOrder?.autoAssigned || false}
              assignedMatchId={createdOrder?.assignedMatchId || createdOrder?.assignedTravelerId || createdOrder?.assignedPartnerId || null}
            />
          </div>
        )}

        {/* Payment Form - Show after order creation (or after match selection) */}
        {showPayment && createdOrder && !showMatchSelection && (
          <div className="mb-8">
            {/* Show estimated payment if partner hasn't accepted yet */}
            {createdOrder.assignedPartnerId && createdOrder.partnerAcceptanceStatus !== 'accepted' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      Estimated Payment (Waiting for Partner Confirmation)
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      Your order has been matched with a delivery partner. The partner is reviewing your order and will confirm the final price shortly. 
                      You will receive an email with the confirmed price once the partner accepts your order.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Estimated Payment Breakdown:</h4>
                      <div className="space-y-2 text-sm">
                        {itemValue > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Item Value:</span>
                            <span className="font-semibold">{itemValue.toFixed(2)} ETB</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Fee (Estimated):</span>
                          <span className="font-semibold">{calculateFees().deliveryFee.toFixed(2)} ETB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service Fee:</span>
                          <span className="font-semibold">{calculateFees().serviceFee.toFixed(2)} ETB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform Fee:</span>
                          <span className="font-semibold">{calculateFees().platformFee.toFixed(2)} ETB</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg">
                          <span>Estimated Total:</span>
                          <span className="text-yellow-600">{(itemValue + calculateFees().total).toFixed(2)} ETB</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3 italic">
                        * Final price will be confirmed by the delivery partner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show actual payment form when partner has accepted */}
            {(!createdOrder.assignedPartnerId || createdOrder.partnerAcceptanceStatus === 'accepted') && (
              <PaymentForm
                orderId={createdOrder._id}
                buyerId={createdBuyerId}
                amount={itemValue}
                fees={createdOrder.pricing ? {
                  deliveryFee: createdOrder.pricing.deliveryFee || calculateFees().deliveryFee,
                  serviceFee: createdOrder.pricing.serviceFee || calculateFees().serviceFee,
                  platformFee: createdOrder.pricing.platformFee || calculateFees().platformFee,
                  total: createdOrder.pricing.totalAmount || (itemValue + calculateFees().total)
                } : calculateFees()}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            )}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : message.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-blue-100 text-blue-800 border border-blue-300'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : message.type === 'error' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" style={{ display: (showMatchSelection || showPayment) ? 'none' : 'block' }}>
            {/* Delivery Method Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🚚</span>
                Choose Delivery Method
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="deliveryMethod"
                  required
                  value={formData.deliveryMethod}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                >
                  <option value="traveler">Traveler</option>
                  <option value="delivery_partner">Delivery Partner</option>
                  <option value="acha_sisters_delivery_partner">Acha Sisters Delivery Partner</option>
                  <option value="gift_delivery_partner">Acha Gift Delivery Partner</option>
                  <option value="movers_packers">Packers and Movers</option>
                </select>
              </div>
            </div>

            {/* Buyer Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Buyer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp (Optional)
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram (Optional)
                  </label>
                  <input
                    type="text"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="currentCity"
                    required
                    value={formData.currentCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="New York"
                  />
                  <p className="mt-1 text-xs text-gray-500">City where the item will be picked up</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location (Address) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    placeholder="Street address, building, landmark"
                  />
                  <p className="mt-1 text-xs text-gray-500">Full address where the item will be picked up from</p>
                </div>
                <div className="md:col-span-2">
                  <FileUpload
                    label="ID/Driving License/Passport (Optional)"
                    value={formData.idDocument}
                    onChange={(path) => setFormData(prev => ({ ...prev, idDocument: path }))}
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📍</span>
                Delivery Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.deliveryMethod === 'traveler' ? (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Destination <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="deliveryDestination"
                      required
                      value={formData.deliveryDestination}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="e.g., Addis Ababa, New York, London"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter the city or location where you want this item to be delivered</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="deliveryCity"
                        required
                        value={formData.deliveryCity}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                        placeholder="e.g., Addis Ababa"
                      />
                      <p className="mt-1 text-xs text-gray-500">City where the item will be delivered</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="deliverySubcity"
                        required
                        value={formData.deliverySubcity}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                        placeholder="e.g., Bole, Kirkos, etc."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Location (Street Address) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="deliveryStreetAddress"
                        required
                        value={formData.deliveryStreetAddress}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                        placeholder="e.g., Street name, building number, landmark"
                      />
                      <p className="mt-1 text-xs text-gray-500">Full address where the item will be delivered to</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Details (Optional)
                      </label>
                      <textarea
                        name="deliveryAdditionalInfo"
                        value={formData.deliveryAdditionalInfo}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                        placeholder="Any additional information that helps locate the delivery location (landmarks, directions, etc.)"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="preferredDeliveryDate"
                    required
                    value={formData.preferredDeliveryDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Gift Delivery Partner Specific Fields */}
            {formData.deliveryMethod === 'gift_delivery_partner' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  Gift Recipient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="recipientName"
                      required
                      value={formData.recipientName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="Recipient's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="recipientPhone"
                      required
                      value={formData.recipientPhone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="recipientEmail"
                      required
                      value={formData.recipientEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="recipientAddress"
                      required
                      value={formData.recipientAddress}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="Full delivery address for the recipient"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Partner Type <span className="text-red-500">*</span>
                    </label>
                    {loadingGiftPartners ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Loading partner types...</span>
                      </div>
                    ) : (
                      <div>
                        <select
                          name="partnerType"
                          required
                          value={selectedPartnerType}
                          onChange={handlePartnerTypeChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                        >
                          <option value="">-- Select Partner Type --</option>
                          {/* Show partner types that actually have gifts available */}
                          {giftPartners.length > 0 ? (
                            [...new Set(giftPartners.map((p: any) => p.partnerType).filter(Boolean))].map((type: string) => (
                              <option key={type} value={type}>{type}</option>
                            ))
                          ) : (
                            // Fallback to default options if no partners loaded yet
                            <>
                              <option value="Flower Seller">Flower Seller</option>
                              <option value="Event & Wedding Organisers">Event & Wedding Organisers</option>
                              <option value="Gift Articles Seller">Gift Articles Seller</option>
                              <option value="Bakery">Bakery</option>
                              <option value="Supermarkets">Supermarkets</option>
                              <option value="Catering">Catering</option>
                              <option value="Others">Others</option>
                              <option value="Cafeteria & Others">Cafeteria & Others</option>
                            </>
                          )}
                        </select>
                        {giftPartners.length > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {giftPartners.length} partner(s) with gifts available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gift Message (Optional)
                    </label>
                    <textarea
                      name="giftMessage"
                      value={formData.giftMessage}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="Personal message to include with the gift"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Movers & Packers Specific Fields */}
            {formData.deliveryMethod === 'movers_packers' && (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🚚</span>
                  Moving & Packing Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="pickupAddress"
                      required
                      value={formData.pickupAddress}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="Full address where items will be picked up"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Items/Boxes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="numberOfItems"
                      required
                      value={formData.numberOfItems}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="e.g., 5 boxes, 10 items"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Delivery Mechanism <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="deliveryMechanism"
                      required
                      value={formData.deliveryMechanism}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    >
                      <option value="">-- Select Mechanism --</option>
                      <option value="truck">Truck</option>
                      <option value="van">Van</option>
                      <option value="pickup-truck">Pickup Truck</option>
                      <option value="motorcycle-rider">Motorcycle Rider</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Value (Optional)
                    </label>
                    <input
                      type="text"
                      name="estimatedValue"
                      value={formData.estimatedValue}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="Estimated value of items"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Handling Requirements (Optional)
                    </label>
                    <textarea
                      name="specialHandling"
                      value={formData.specialHandling}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="Any special handling, fragile items, or specific instructions"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gift Selection Section (for gift_delivery_partner) */}
            {formData.deliveryMethod === 'gift_delivery_partner' ? (
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  Select Gift
                </h2>
                {loadingGiftPartners ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading partners...</span>
                  </div>
                ) : !selectedPartnerType ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Please select a Partner Type above to see available gifts.
                    </p>
                    {giftPartners.length > 0 && (
                      <p className="text-xs text-yellow-700 mt-2">
                        Found {giftPartners.length} partner(s) with gifts available.
                      </p>
                    )}
                  </div>
                ) : availableGiftTypes.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      No gifts available for the selected partner type "{selectedPartnerType}".
                    </p>
                    {giftPartners.length > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        <p>Available partner types with gifts:</p>
                        <ul className="list-disc list-inside mt-1">
                          {[...new Set(giftPartners.map((p: any) => p.partnerType))].map((type: string) => (
                            <li key={type}>{type}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Select a gift from the available options below:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableGiftTypes.map((giftType, index) => (
                        <div
                          key={index}
                          onClick={() => handleGiftTypeSelect(giftType)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            selectedGiftType?._id === giftType._id || 
                            (selectedGiftType && selectedGiftType.partnerId === giftType.partnerId && selectedGiftType.type === giftType.type)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          {giftType.photo && (
                            <div className="mb-3">
                              <img
                                src={giftType.photo.startsWith('http') ? giftType.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${giftType.photo}`}
                                alt={giftType.type}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {giftType.type}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">{giftType.description}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-green-600">
                              ETB {giftType.price?.toLocaleString() || '0'}
                            </span>
                            {selectedGiftType?._id === giftType._id || 
                             (selectedGiftType && selectedGiftType.partnerId === giftType.partnerId && selectedGiftType.type === giftType.type) ? (
                              <span className="text-blue-600 text-sm font-medium">✓ Selected</span>
                            ) : null}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <p>Partner: {giftType.partnerName}</p>
                            {giftType.partnerCity && <p>Location: {giftType.partnerCity}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedGiftType && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          ✓ Gift Selected: {selectedGiftType.description}
                        </p>
                        <p className="text-sm text-green-700">
                          Price: ETB {selectedGiftType.price?.toLocaleString() || '0'} | 
                          Partner: {selectedGiftType.partnerName}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Order Information Section (for other delivery methods) */
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Order Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.deliveryMethod !== 'movers_packers' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="productName"
                        required
                        value={formData.productName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                        placeholder="e.g., Smartphone, Laptop, etc."
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="productDescription"
                      required
                      value={formData.productDescription}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="Describe your product in detail..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="e.g., Apple, Samsung, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pieces/Weight <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="quantityType"
                      required
                      value={formData.quantityType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    >
                      <option value="pieces">Pieces</option>
                      <option value="weight">Weight</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="quantityDescription"
                      required
                      value={formData.quantityDescription}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="e.g., 2 pieces, 5kg, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      name="manufacturingDate"
                      value={formData.manufacturingDate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country of Origination
                    </label>
                    <input
                      type="text"
                      name="countryOfOrigin"
                      value={formData.countryOfOrigin}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      placeholder="e.g., USA, China, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Section (not shown for gift_delivery_partner) */}
            {formData.deliveryMethod !== 'gift_delivery_partner' && (
              <div className="pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">📎</span>
                  Attachments
                </h2>
              <div className="space-y-6">
                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (Multiple)
                  </label>
                  <div className="space-y-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-700 flex-1 truncate">{photo}</span>
                        <button
                          type="button"
                          onClick={() => handlePhotoRemove(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                        }}
                        disabled={photoUploading}
                        className="hidden"
                      />
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {photoUploading ? 'Uploading...' : '📷 Upload Photo'}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Video */}
                <VideoUpload
                  label="Video (30 seconds max)"
                  value={formData.video}
                  onChange={(path) => setFormData(prev => ({ ...prev, video: path }))}
                />
              </div>
            </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1E88E5 0%, #26C6DA 50%, #43A047 100%)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting Order...
                  </span>
                ) : (
                  'Post Order'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all duration-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostOrder;

