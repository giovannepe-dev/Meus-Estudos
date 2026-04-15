export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          alert_days_before: number
          created_at: string
          id: string
          label_mode: Database["public"]["Enums"]["label_mode"]
          tombo_mode: Database["public"]["Enums"]["tombo_mode"]
          tombo_padding: number
        }
        Insert: {
          alert_days_before?: number
          created_at?: string
          id?: string
          label_mode?: Database["public"]["Enums"]["label_mode"]
          tombo_mode?: Database["public"]["Enums"]["tombo_mode"]
          tombo_padding?: number
        }
        Update: {
          alert_days_before?: number
          created_at?: string
          id?: string
          label_mode?: Database["public"]["Enums"]["label_mode"]
          tombo_mode?: Database["public"]["Enums"]["tombo_mode"]
          tombo_padding?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          nome?: string
        }
        Relationships: []
      }
      inventories: {
        Row: {
          data_fim: string | null
          data_inicio: string
          id: string
          iniciado_por_usuario_id: string
          room_id: string
          status: Database["public"]["Enums"]["status_inventario"]
        }
        Insert: {
          data_fim?: string | null
          data_inicio?: string
          id?: string
          iniciado_por_usuario_id: string
          room_id: string
          status?: Database["public"]["Enums"]["status_inventario"]
        }
        Update: {
          data_fim?: string | null
          data_inicio?: string
          id?: string
          iniciado_por_usuario_id?: string
          room_id?: string
          status?: Database["public"]["Enums"]["status_inventario"]
        }
        Relationships: [
          {
            foreignKeyName: "inventories_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_scans: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          item_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          item_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          item_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_scans_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_scans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_attachments: {
        Row: {
          created_at: string
          id: string
          item_id: string
          tipo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          tipo?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          tipo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_attachments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_audit_logs: {
        Row: {
          campo: string
          created_at: string
          id: string
          item_id: string
          usuario_id: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo: string
          created_at?: string
          id?: string
          item_id: string
          usuario_id: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo?: string
          created_at?: string
          id?: string
          item_id?: string
          usuario_id?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_audit_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          categoria_id: string | null
          created_at: string
          criticidade: Database["public"]["Enums"]["criticidade_item"]
          data_aquisicao: string | null
          data_instalacao: string | null
          estado: Database["public"]["Enums"]["estado_item"]
          id: string
          is_active: boolean
          marca: string
          modelo: string
          nome_item: string
          numero_anvisa: string | null
          numero_serie: string | null
          observacoes: string | null
          responsavel: string | null
          sala_atual_id: string
          status: Database["public"]["Enums"]["status_item"]
          tipo_item: Database["public"]["Enums"]["tipo_item"]
          tombo: string
          updated_at: string
          valor_aquisicao: number | null
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade_item"]
          data_aquisicao?: string | null
          data_instalacao?: string | null
          estado?: Database["public"]["Enums"]["estado_item"]
          id?: string
          is_active?: boolean
          marca?: string
          modelo?: string
          nome_item: string
          numero_anvisa?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          responsavel?: string | null
          sala_atual_id: string
          status?: Database["public"]["Enums"]["status_item"]
          tipo_item: Database["public"]["Enums"]["tipo_item"]
          tombo: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade_item"]
          data_aquisicao?: string | null
          data_instalacao?: string | null
          estado?: Database["public"]["Enums"]["estado_item"]
          id?: string
          is_active?: boolean
          marca?: string
          modelo?: string
          nome_item?: string
          numero_anvisa?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          responsavel?: string | null
          sala_atual_id?: string
          status?: Database["public"]["Enums"]["status_item"]
          tipo_item?: Database["public"]["Enums"]["tipo_item"]
          tombo?: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_sala_atual_id_fkey"
            columns: ["sala_atual_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          kit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          kit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          kit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_items_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      kit_locations: {
        Row: {
          created_at: string
          id: string
          kit_id: string
          sala_id: string
          tombo: string
        }
        Insert: {
          created_at?: string
          id?: string
          kit_id: string
          sala_id: string
          tombo: string
        }
        Update: {
          created_at?: string
          id?: string
          kit_id?: string
          sala_id?: string
          tombo?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_locations_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_locations_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      kits: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          sala_id: string | null
          tombo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          sala_id?: string | null
          tombo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          sala_id?: string | null
          tombo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kits_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      label_templates: {
        Row: {
          altura_mm: number
          created_at: string
          elements_json: Json
          id: string
          is_default: boolean
          largura_mm: number
          nome: string
          updated_at: string
        }
        Insert: {
          altura_mm?: number
          created_at?: string
          elements_json?: Json
          id?: string
          is_default?: boolean
          largura_mm?: number
          nome: string
          updated_at?: string
        }
        Update: {
          altura_mm?: number
          created_at?: string
          elements_json?: Json
          id?: string
          is_default?: boolean
          largura_mm?: number
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenances: {
        Row: {
          anexo_url: string | null
          created_at: string
          custo: number | null
          data: string
          fornecedor: string | null
          id: string
          item_id: string
          observacao: string | null
          proxima_manutencao_data: string | null
          tipo: Database["public"]["Enums"]["tipo_manutencao"]
        }
        Insert: {
          anexo_url?: string | null
          created_at?: string
          custo?: number | null
          data: string
          fornecedor?: string | null
          id?: string
          item_id: string
          observacao?: string | null
          proxima_manutencao_data?: string | null
          tipo: Database["public"]["Enums"]["tipo_manutencao"]
        }
        Update: {
          anexo_url?: string | null
          created_at?: string
          custo?: number | null
          data?: string
          fornecedor?: string | null
          id?: string
          item_id?: string
          observacao?: string | null
          proxima_manutencao_data?: string | null
          tipo?: Database["public"]["Enums"]["tipo_manutencao"]
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          created_at: string
          de_sala_id: string
          id: string
          item_id: string
          motivo: Database["public"]["Enums"]["motivo_movimentacao"]
          observacao: string | null
          para_sala_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          de_sala_id: string
          id?: string
          item_id: string
          motivo: Database["public"]["Enums"]["motivo_movimentacao"]
          observacao?: string | null
          para_sala_id: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          de_sala_id?: string
          id?: string
          item_id?: string
          motivo?: Database["public"]["Enums"]["motivo_movimentacao"]
          observacao?: string | null
          para_sala_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_de_sala_id_fkey"
            columns: ["de_sala_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_para_sala_id_fkey"
            columns: ["para_sala_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      printer_profiles: {
        Row: {
          altura_mm: number
          created_at: string
          escala: number | null
          id: string
          is_default: boolean
          largura_mm: number
          margem_bottom_mm: number
          margem_left_mm: number
          margem_right_mm: number
          margem_top_mm: number
          nome: string
          orientacao: string
          tipo_impressao: string
        }
        Insert: {
          altura_mm?: number
          created_at?: string
          escala?: number | null
          id?: string
          is_default?: boolean
          largura_mm?: number
          margem_bottom_mm?: number
          margem_left_mm?: number
          margem_right_mm?: number
          margem_top_mm?: number
          nome: string
          orientacao?: string
          tipo_impressao?: string
        }
        Update: {
          altura_mm?: number
          created_at?: string
          escala?: number | null
          id?: string
          is_default?: boolean
          largura_mm?: number
          margem_bottom_mm?: number
          margem_left_mm?: number
          margem_right_mm?: number
          margem_top_mm?: number
          nome?: string
          orientacao?: string
          tipo_impressao?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          nome: string
          sector_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          sector_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          nome: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_tombo: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_overdue_maintenance: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "patrimonio" | "inventario" | "gestor"
      criticidade_item: "BAIXA" | "MEDIA" | "ALTA"
      estado_item: "NOVO" | "BOM" | "REGULAR" | "RUIM" | "INSERVIVEL"
      label_mode: "QRCODE" | "BARCODE" | "BOTH"
      motivo_movimentacao:
        | "TRANSFERENCIA"
        | "EMPRESTIMO"
        | "DEVOLUCAO"
        | "MANUTENCAO"
        | "OUTROS"
      status_inventario: "EM_ANDAMENTO" | "CONCLUIDO"
      status_item:
        | "EM_USO"
        | "EM_MANUTENCAO"
        | "BAIXADO"
        | "EMPRESTADO"
        | "EM_DIVERGENCIA"
      tipo_item: "BIOMEDICO" | "TI" | "MOBILIARIO" | "INSTRUMENTAL" | "OUTROS"
      tipo_manutencao: "PREVENTIVA" | "CORRETIVA" | "CALIBRACAO"
      tombo_mode: "AUTO_SEQUENCIAL" | "MANUAL"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "patrimonio", "inventario", "gestor"],
      criticidade_item: ["BAIXA", "MEDIA", "ALTA"],
      estado_item: ["NOVO", "BOM", "REGULAR", "RUIM", "INSERVIVEL"],
      label_mode: ["QRCODE", "BARCODE", "BOTH"],
      motivo_movimentacao: [
        "TRANSFERENCIA",
        "EMPRESTIMO",
        "DEVOLUCAO",
        "MANUTENCAO",
        "OUTROS",
      ],
      status_inventario: ["EM_ANDAMENTO", "CONCLUIDO"],
      status_item: [
        "EM_USO",
        "EM_MANUTENCAO",
        "BAIXADO",
        "EMPRESTADO",
        "EM_DIVERGENCIA",
      ],
      tipo_item: ["BIOMEDICO", "TI", "MOBILIARIO", "INSTRUMENTAL", "OUTROS"],
      tipo_manutencao: ["PREVENTIVA", "CORRETIVA", "CALIBRACAO"],
      tombo_mode: ["AUTO_SEQUENCIAL", "MANUAL"],
    },
  },
} as const
