'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';

export function ContactPage() {
  const { t, isBn } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'standard',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 vercel-radial">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-3xl space-y-4"
      >
        <div className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('contact.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
          {t('contact.title')}
        </h1>
        <p className="text-base sm:text-lg text-[#555555] leading-relaxed">
          {t('contact.subtitle')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Contact Form (7 cols) with shadcn UI controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-7 bg-white p-7 sm:p-9 rounded-2xl border border-[#EAEAEA] shadow-2xs"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-black tracking-tight">
                {t('contact.success_title')}
              </h2>
              <p className="text-sm text-[#555555] max-w-md mx-auto leading-relaxed">
                {t('contact.success_desc')}
              </p>
              <Button
                variant="link"
                onClick={() => setSubmitted(false)}
                className="text-xs text-black font-semibold pt-2"
              >
                {t('contact.send_another')}
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.name')}</Label>
                  <Input
                    id="name"
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isBn ? 'উদা: তারেক চৌধুরী' : 'e.g. Tarek Chowdhury'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('contact.email')}</Label>
                  <Input
                    id="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('contact.phone')}</Label>
                  <Input
                    id="phone"
                    required
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01712345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-select">{t('contact.plan')}</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(val) => setFormData({ ...formData, plan: val })}
                  >
                    <SelectTrigger id="plan-select">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">
                        {isBn ? 'Starter Plan (১৫০ ৳ / ৭৫ ওয়েব ফাইল)' : 'Starter Plan (150 ৳ / 75 files)'}
                      </SelectItem>
                      <SelectItem value="standard">
                        {isBn ? 'Standard Plan (৩০০ ৳ / ২০০ ওয়েব ফাইল)' : 'Standard Plan (300 ৳ / 200 files)'}
                      </SelectItem>
                      <SelectItem value="agency">
                        {isBn ? 'Agency Pro (৫০০ ৳ / আনলিমিটেড + এআই)' : 'Agency Pro (500 ৳ / Unlimited + AI)'}
                      </SelectItem>
                      <SelectItem value="custom">
                        {isBn ? 'এজেন্সি কাস্টম ইন্টিগ্রেশন' : 'Agency Custom Integration'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('contact.message')}</Label>
                <Textarea
                  id="message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    isBn
                      ? 'আপনার কী ধরনের সহায়তা প্রয়োজন তা সংক্ষেপে লিখুন...'
                      : 'Tell us what you need assistance with...'
                  }
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
              >
                <span>{t('contact.submit')}</span>
                <Send className="w-4 h-4 ml-1" />
              </Button>

            </form>
          )}
        </motion.div>

        {/* Right: Contact Information Cards (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="lg:col-span-5 space-y-6"
        >
          
          <div className="bg-[#FAFAFA] p-7 rounded-2xl border border-[#EAEAEA] space-y-5 shadow-2xs">
            <h2 className="text-base font-bold text-black tracking-tight">
              {isBn ? 'সরাসরি যোগাযোগের মাধ্যম' : 'Direct communication channels'}
            </h2>
            <div className="space-y-4 text-sm text-[#555555]">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#EAEAEA] flex items-center justify-center text-black shrink-0 shadow-2xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-black text-xs sm:text-sm">
                    {isBn ? 'হোয়াটসঅ্যাপ হটলাইন' : 'WhatsApp Hotline'}
                  </div>
                  <div className="font-mono text-xs text-black font-semibold pt-0.5">+880 1700-000000</div>
                  <div className="text-xs text-[#888888]">
                    {isBn ? 'তাৎক্ষণিক মেসেজ সহায়তা' : 'Instant messaging support'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#EAEAEA] flex items-center justify-center text-black shrink-0 shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-black text-xs sm:text-sm">
                    {isBn ? 'ইমেইল সাপোর্ট' : 'Email support'}
                  </div>
                  <div className="text-xs text-black font-semibold pt-0.5">support@pothikvisa.com</div>
                  <div className="text-xs text-[#888888]">
                    {isBn ? 'গড় রেসপন্স সময় ২ ঘণ্টার মধ্যে' : 'Avg response within 2 hours'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-white border border-[#EAEAEA] flex items-center justify-center text-black shrink-0 shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-black text-xs sm:text-sm">
                    {isBn ? 'অপারেশন ডেস্ক' : 'Operations Desk'}
                  </div>
                  <div className="text-xs text-black font-semibold pt-0.5">
                    {isBn ? 'ঢাকা, বাংলাদেশ' : 'Dhaka, Bangladesh'}
                  </div>
                  <div className="text-xs text-[#888888]">
                    {isBn ? 'শনিবার – বৃহস্পতিবার (সকাল ৯টা – রাত ৮টা)' : 'Saturday – Thursday (9AM – 8PM)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-[#EAEAEA] space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold text-black tracking-tight">
              {isBn ? 'এজেন্সি অনবোর্ডিং ও সাইবার ক্যাফে' : 'Agency onboarding & cyber cafes'}
            </h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              {isBn
                ? 'আপনার এজেন্সি যদি সপ্তাহে ৫০টির বেশি ফর্ম প্রসেস করে, তবে মাল্টি-সিট অ্যাকাউন্ট, সরাসরি এমএফএস ইনভয়েস এবং ডেডিকেটেড কিউ অ্যাক্সেসের জন্য যোগাযোগ করুন।'
                : 'If your agency processes more than 50 applications per week, reach out for multi-seat setup, direct MFS billing invoices, and priority automation queues.'}
            </p>
          </div>

        </motion.div>

      </div>

    </div>
  );
}

export default ContactPage;
