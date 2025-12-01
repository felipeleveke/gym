'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/use-camera';
import { isNativePlatform } from '@/lib/capacitor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Upload, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'athlete' | 'trainer' | 'admin';
}

interface ProfileFormProps {
  initialProfile: Profile;
  userEmail: string;
}

export function ProfileForm({ initialProfile, userEmail }: ProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { takePhoto, pickFromGallery, isLoading: cameraLoading } = useCamera();
  const isNative = isNativePlatform();

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile.avatar_url);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo?.webPath) {
      await uploadPhotoFromUri(photo.webPath);
    }
  };

  const handlePickFromGallery = async () => {
    const photo = await pickFromGallery();
    if (photo?.webPath) {
      await uploadPhotoFromUri(photo.webPath);
    }
  };

  const uploadPhotoFromUri = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      // Convertir URI a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Crear File desde blob
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const file = new File([blob], fileName, { type: blob.type });
      const filePath = `${profile.id}/${fileName}`;

      // Eliminar avatar anterior si existe
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Subir nuevo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar perfil con nueva URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      setAvatarPreview(data.publicUrl);
      toast({
        title: 'Avatar actualizado',
        description: 'Tu foto de perfil ha sido actualizada correctamente',
      });

      // Disparar evento para actualizar el sidebar
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error: any) {
      console.error('Error uploading avatar from camera:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al subir el avatar',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona una imagen válida',
      });
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La imagen debe ser menor a 5MB',
      });
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir a Supabase Storage
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Eliminar avatar anterior si existe
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Subir nuevo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar perfil con nueva URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((prev) => ({ ...prev, avatar_url: data.publicUrl }));
      toast({
        title: 'Avatar actualizado',
        description: 'Tu foto de perfil ha sido actualizada correctamente',
      });

      // Disparar evento para actualizar el sidebar
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al subir el avatar',
      });
      // Revertir preview si falla
      setAvatarPreview(profile.avatar_url);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (profileError) {
        throw profileError;
      }

      // Cambiar contraseña si se proporcionó
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }

        if (passwordData.newPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }

        // Actualizar contraseña
        const { error: passwordError } = await supabase.auth.updateUser({
          password: passwordData.newPassword,
        });

        if (passwordError) {
          throw passwordError;
        }

        // Limpiar campos de contraseña
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }

      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios han sido guardados correctamente',
      });

      // Disparar evento para actualizar el sidebar
      window.dispatchEvent(new CustomEvent('profile-updated'));

      router.refresh();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al actualizar el perfil',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      athlete: 'Atleta',
      trainer: 'Entrenador',
      admin: 'Administrador',
    };
    return labels[role] || role;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del Perfil */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Perfil</CardTitle>
          <CardDescription>
            Actualiza tu información personal y foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {isNative ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTakePhoto}
                    disabled={uploadingAvatar || cameraLoading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Tomar foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePickFromGallery}
                    disabled={uploadingAvatar || cameraLoading}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Galería
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                JPG, PNG o GIF. Máximo 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              value={profile.full_name || ''}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, full_name: e.target.value }))
              }
              placeholder="Ingresa tu nombre completo"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={userEmail}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              El correo electrónico no se puede cambiar
            </p>
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label>Rol</Label>
            <div>
              <Badge variant="secondary">{getRoleLabel(profile.role)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu rol en el sistema
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cambio de Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>
            Deja estos campos vacíos si no deseas cambiar tu contraseña
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              placeholder="Repite la nueva contraseña"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}

