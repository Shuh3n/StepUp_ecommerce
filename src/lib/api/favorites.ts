import { supabase } from "@/lib/supabase";

// export async function getFavoritesFromEdge() {
//   const { data: { user }, error: authError } = await supabase.auth.getUser();
//   if (authError || !user) {
//     console.error("No se pudo obtener el usuario autenticado:", authError);
//     return [];
//   } else {
//     console.log("getFavoritesFromEdge: auth_id (user.id):", user.id, "email:", user.email);
//   }

//   const { data, error } = await supabase.functions.invoke('get-favorites');
//   if (error) {
//     console.error("Error obteniendo favoritos:", error);
//     return [];
//   }
//   console.log("getFavoritesFromEdge: respuesta completa:", data);

//   // Acceso correcto:
//   if (data && Array.isArray(data.favorites)) return data.favorites;
//   return [];
// }


export async function getFavoritesFromEdgeRaw() {
  const { data } = await supabase.auth.getSession();
  const access_token = data?.session?.access_token;
  if (!access_token) {
    console.error("No autenticado");
    return [];
  }
  const response = await fetch("https://<TU-PROYECTO>.supabase.co/functions/v1/get-favorites", {
    method: "POST", // o "GET" si tu función Edge acepta GET
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`,
    },
  });
  const result = await response.json();
  console.log("Respuesta cruda fetch:", result);
  if (result.ok === false) {
    console.error("Error desde edge:", result.error);
    return [];
  }
  if (Array.isArray(result.favorites)) return result.favorites;
  if (Array.isArray(result)) return result;
  return [];
}

// Agregar favorito
export async function addFavorite(product_id: number) {
  const { error } = await supabase.functions.invoke('add-favorite', {
    body: { product_id }
  });
  if (error) {
    console.error("Error agregando a favoritos:", error);
    return false;
  }
  return true;
}


// Eliminar favorito
export async function removeFavorite(product_id: number) {
  const { error } = await supabase.functions.invoke('remove-favorite', {
    body: { product_id }
  });
  if (error) {
    console.error("Error eliminando de favoritos:", error);
    return false;
  }
  return true;
}