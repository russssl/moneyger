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
} from '@/components/Modal'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectGroup, SelectContent, SelectItem, SelectLabel } from '../ui/select';

export default function SettingsModal() {
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
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a currency" />
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
              <Button>Close</Button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </>
  );
}