import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ImageIcon, Video, Edit2, Share2, Trash2, Facebook, Instagram, MessageCircle, Twitter, Send } from "lucide-react";
import { Property } from "@/types/property";

interface AdminPropertiesTableProps {
  properties: Property[];
  loading: boolean;
  filteredProperties: Property[];
  selectedProperties: string[];
  setSelectedProperties: (ids: string[]) => void;
  updateStatus: (id: string, status: "available" | "pending" | "sold") => void;
  openEditDialog: (property: Property) => void;
  deleteProperty: (id: string) => void;
  shareToFacebook: (property: Property) => void;
  shareToTwitter: (property: Property) => void;
  shareToWhatsApp: (property: Property) => void;
  shareToTelegram: (property: Property) => void;
  shareToInstagram: (property: Property) => void;
  shareToTikTok: (property: Property) => void;
}

export const AdminPropertiesTable = ({
  properties,
  loading,
  filteredProperties,
  selectedProperties,
  setSelectedProperties,
  updateStatus,
  openEditDialog,
  deleteProperty,
  shareToFacebook,
  shareToTwitter,
  shareToWhatsApp,
  shareToTelegram,
  shareToInstagram,
  shareToTikTok,
}: AdminPropertiesTableProps) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-muted border-t-primary rounded-full"></div>
          <p className="mt-2 text-muted-foreground">Loading properties...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground text-lg">
            No properties found matching your filters
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProperties(filteredProperties.map(p => p.id));
                      } else {
                        setSelectedProperties([]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Property</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden md:table-cell">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden lg:table-cell">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden sm:table-cell">Type</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredProperties.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProperties([...selectedProperties, p.id]);
                        } else {
                          setSelectedProperties(selectedProperties.filter(id => id !== p.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        {p.video_url && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                            <Video size={8} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{p.location}</div>
                        <p className="text-xs text-muted-foreground">
                          {p.images?.length || 0} img{p.video_url ? ', 1 vid' : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{p.location || "—"}</td>
                  <td className="px-6 py-4 font-medium text-foreground hidden lg:table-cell">
                    KES {Number(p.price || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={p.status || "available"}
                      onValueChange={(v) => updateStatus(p.id, v as "available" | "pending" | "sold")}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <Badge variant="outline" className="capitalize text-xs">
                      {p.property_type || "land"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(p)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-primary hover:text-primary/80 hover:bg-primary/5"
                          >
                            <Share2 size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => shareToFacebook(p)} className="flex items-center gap-2">
                            <Facebook size={16} className="text-blue-600" />
                            Share on Facebook
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareToTwitter(p)} className="flex items-center gap-2">
                            <Twitter size={16} className="text-blue-400" />
                            Share on X (Twitter)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareToWhatsApp(p)} className="flex items-center gap-2">
                            <MessageCircle size={16} className="text-green-600" />
                            Share on WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareToTelegram(p)} className="flex items-center gap-2">
                            <Send size={16} className="text-blue-500" />
                            Share on Telegram
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareToInstagram(p)} className="flex items-center gap-2">
                            <Instagram size={16} className="text-pink-600" />
                            Copy for Instagram
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareToTikTok(p)} className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
                              <span className="text-white text-xs font-bold">T</span>
                            </div>
                            Copy for TikTok
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteProperty(p.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};