'use client';

import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from '@/components/modal';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem, SelectLabel } from '../ui/select';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingButton from '../loading-button';
import { updateSettings } from '@/server/queries/settings';

export default function SettingsModal() {
  const { data: session } = useSession();
  const [currency, setCurrency] = useState(session?.user.currency);

  if (!session) {
    return null;
  }

  const save = async () => {
    try {
      await updateSettings(session?.user.id, { userId: session?.user.id, currency });
      // Optionally, show a success message or handle the response
    } catch (error) {
      console.error('Failed to update settings:', error);
      // Optionally, show an error message
    }
  };

  return (
    <>
      <Credenza>
        <CredenzaTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}>
            <Settings />
            Settings
          </DropdownMenuItem>
        </CredenzaTrigger>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Setting</CredenzaTitle>
            <CredenzaDescription>
              Change your settings here.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div>
              <div className='flex flex-col space-y-2'>
                <Label>Currency</Label>
                <Select onValueChange={setCurrency} value={currency}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a currency" defaultValue={currency} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Currency</SelectLabel>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="PLN">PLN</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <div className='flex'>
                <Button className='me-3'>Close</Button>
                <LoadingButton loading={false} variant="success" onClick={save}>Save</LoadingButton>
              </div>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}