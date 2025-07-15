import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// IMPORTANT: Replace with your actual Stripe publishable key
const stripePromise = loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');

// The actual checkout form component
const CheckoutForm = ({ invoice }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/portal/payment-success`,
            },
        });

        if (error) {
            setMessage(error.message);
        }

        setIsProcessing(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement />
            <button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full mt-6 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
                <span id="button-text">
                    {isProcessing ? "Processing..." : `Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(invoice.total_amount - invoice.amount_paid)}`}
                </span>
            </button>
            {message && <div id="payment-message" className="mt-4 text-red-600">{message}</div>}
        </form>
    );
};


// The main page component that wraps the form in the Stripe Elements provider
function CheckoutPage() {
    const { invoiceId } = useParams();
    const [clientSecret, setClientSecret] = useState('');
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const createPaymentIntent = async () => {
            if (!invoiceId) return;
            try {
                // In a real app, you would fetch this from your backend (Supabase Edge Function)
                // This function would take the invoiceId, find the amount, and create a Stripe PaymentIntent
                
                // For now, we'll simulate this process
                const { data: invoiceData, error: invoiceError } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('id', invoiceId)
                    .single();
                
                if (invoiceError) throw invoiceError;
                setInvoice(invoiceData);

                // --- THIS IS WHERE YOU'LL CALL YOUR SUPABASE EDGE FUNCTION ---
                // const { data } = await supabase.functions.invoke('create-payment-intent', {
                //     body: { amount: (invoiceData.total_amount - invoiceData.amount_paid) * 100 } // Amount in cents
                // });
                // setClientSecret(data.clientSecret);
                
                // For demonstration purposes, we will show a placeholder message.
                setError("Payment processing is not yet configured. This is a placeholder page.");

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        createPaymentIntent();
    }, [invoiceId]);

    const options = {
        clientSecret,
    };

    if (loading) return <div className="p-8 text-center">Loading Checkout...</div>;
    
    return (
        <div className="p-6 md:p-8 bg-gray-100 min-h-screen">
            <div className="max-w-md mx-auto">
                <div className="mb-4">
                    <Link to="/portal/invoices" className="text-sm text-indigo-600 hover:underline">&larr; Back to Invoices</Link>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Secure Payment</h1>
                    {error && <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
                    
                    {clientSecret && (
                        <Elements stripe={stripePromise} options={options}>
                            <CheckoutForm invoice={invoice} />
                        </Elements>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
