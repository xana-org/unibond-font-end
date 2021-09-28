import { Box }                  from "@chakra-ui/core";
import { useRouter }            from "next/router";
import { useEffect, useState }            from "react";
import { useWallet }            from "use-wallet";

import useDidMount              from "../../hooks/useDidMount";
import { scrollToPosition }     from "../../lib/scroll";
import Footer                   from "../Footer";
import Header                   from "../Header";

const Layout = ({ children }) => {
    const didMount = useDidMount();
    const router = useRouter();
    const { asPath } = router;
    const wallet = useWallet();
    const [isHide, setHide] = useState(true);
    /**
     * Scroll to top on each route change using `asPath` (resolved path),
     * not `pathname` (may be a dynamic route).
     */
    useEffect(() => {
      if (didMount) {
        scrollToPosition();
      }
    }, [asPath]);

    useEffect(() => {
      const status = window.localStorage.getItem("Unibond");
      if (window.ethereum && status === "metamask")
        wallet.connect("injected");
    }, []);
    const handleScroll = (e) => {
      const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
      console.log(e.target.scrollHeight - e.target.scrollTop);
      console.log(e.target.clientHeight);

      if (bottom) {
        setHide(true);
      }
    }
    // useEffect(() => {
    //   const status = window.localStorage.getItem("Unibond");
    //   console.log("AAAA")
    //   if (window.ethereum && wallet && !wallet.ethereum && status === "metamask") {
    //     wallet.connect("injected");
    //   }
    // }, [wallet]);
  
  
    return (
        <Box w="100%" bg="#000%" color="#fff">
            <Header/>
            <Box overflowY="auto" w="100%">
              {children}
              <Footer/>
            </Box>
            {/* {!isHide&&()} */}
        </Box>
    );
  };
  
  export default Layout;