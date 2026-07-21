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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      partida_preguntas: {
        Row: {
          created_at: string
          id: string
          orden: number
          partida_id: string
          pregunta_id: string
          resultado: string | null
          segundos_usados: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          orden: number
          partida_id: string
          pregunta_id: string
          resultado?: string | null
          segundos_usados?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          orden?: number
          partida_id?: string
          pregunta_id?: string
          resultado?: string | null
          segundos_usados?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partida_preguntas_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partida_preguntas_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas: {
        Row: {
          cantidad: number
          categoria: string | null
          correctas: number
          created_at: string
          estado: string
          id: string
          incorrectas: number
          nivel: string | null
          nombre: string | null
          tiempo_segundos: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cantidad?: number
          categoria?: string | null
          correctas?: number
          created_at?: string
          estado?: string
          id?: string
          incorrectas?: number
          nivel?: string | null
          nombre?: string | null
          tiempo_segundos?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cantidad?: number
          categoria?: string | null
          correctas?: number
          created_at?: string
          estado?: string
          id?: string
          incorrectas?: number
          nivel?: string | null
          nombre?: string | null
          tiempo_segundos?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      preguntas: {
        Row: {
          categoria: string
          created_at: string
          explicacion: string | null
          fecha_actualizacion: string
          fuente: string | null
          id: string
          imagen: string | null
          nivel: string
          nivel_confianza: number
          opciones: Json
          origen: string
          pregunta: string
          respuesta: string
          subcategoria: string | null
          tags: string[]
          tipo: string
          updated_at: string
          vigencia: string | null
        }
        Insert: {
          categoria: string
          created_at?: string
          explicacion?: string | null
          fecha_actualizacion?: string
          fuente?: string | null
          id?: string
          imagen?: string | null
          nivel: string
          nivel_confianza?: number
          opciones?: Json
          origen?: string
          pregunta: string
          respuesta: string
          subcategoria?: string | null
          tags?: string[]
          tipo?: string
          updated_at?: string
          vigencia?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          explicacion?: string | null
          fecha_actualizacion?: string
          fuente?: string | null
          id?: string
          imagen?: string | null
          nivel?: string
          nivel_confianza?: number
          opciones?: Json
          origen?: string
          pregunta?: string
          respuesta?: string
          subcategoria?: string | null
          tags?: string[]
          tipo?: string
          updated_at?: string
          vigencia?: string | null
        }
        Relationships: []
      }
      sala_jugadores: {
        Row: {
          correctas: number
          created_at: string
          id: string
          incorrectas: number
          nickname: string
          puntos: number
          sala_id: string
        }
        Insert: {
          correctas?: number
          created_at?: string
          id?: string
          incorrectas?: number
          nickname: string
          puntos?: number
          sala_id: string
        }
        Update: {
          correctas?: number
          created_at?: string
          id?: string
          incorrectas?: number
          nickname?: string
          puntos?: number
          sala_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sala_jugadores_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      sala_respuestas: {
        Row: {
          correcta: boolean
          created_at: string
          id: string
          jugador_id: string
          orden: number
          puntos: number
          respuesta: string
          sala_id: string
          segundos: number | null
        }
        Insert: {
          correcta: boolean
          created_at?: string
          id?: string
          jugador_id: string
          orden: number
          puntos?: number
          respuesta: string
          sala_id: string
          segundos?: number | null
        }
        Update: {
          correcta?: boolean
          created_at?: string
          id?: string
          jugador_id?: string
          orden?: number
          puntos?: number
          respuesta?: string
          sala_id?: string
          segundos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sala_respuestas_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "sala_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sala_respuestas_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      salas: {
        Row: {
          cantidad: number
          categoria: string | null
          codigo: string
          created_at: string
          estado: string
          host_id: string
          id: string
          nivel: string | null
          orden_actual: number
          pregunta_ids: string[]
          pregunta_started_at: string | null
          tiempo_segundos: number
          updated_at: string
        }
        Insert: {
          cantidad?: number
          categoria?: string | null
          codigo: string
          created_at?: string
          estado?: string
          host_id: string
          id?: string
          nivel?: string | null
          orden_actual?: number
          pregunta_ids?: string[]
          pregunta_started_at?: string | null
          tiempo_segundos?: number
          updated_at?: string
        }
        Update: {
          cantidad?: number
          categoria?: string | null
          codigo?: string
          created_at?: string
          estado?: string
          host_id?: string
          id?: string
          nivel?: string | null
          orden_actual?: number
          pregunta_ids?: string[]
          pregunta_started_at?: string | null
          tiempo_segundos?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator"
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
      app_role: ["admin", "moderator"],
    },
  },
} as const
